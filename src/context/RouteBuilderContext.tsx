import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import { apiConfig } from "../config/api";
import { apiClient } from "../api/client";
import { createRoute } from "../api/routes";
import { validateDraft } from "./validation";
import { draftIsLocked } from "./routeBuilderReducer";
import { listStops } from "../api/stops";
import {
  ApiFailure,
  RequestCancelled,
  type RouteBuilderState,
  type SelectionMode,
  type SubmissionState,
} from "../types/domain";
import {
  createInitialState,
  routeBuilderReducer,
  type RouteBuilderAction,
} from "./routeBuilderReducer";

interface LoadOptions {
  query?: string;
  force?: boolean;
}

type UnknownSubmission = Extract<SubmissionState, { status: "unknown" }>;
type SubmitResult = "invalid" | "blocked" | "success" | "failed";

interface RouteBuilderContextValue {
  state: RouteBuilderState;
  loadStops: (options?: LoadOptions) => Promise<void>;
  search: (text: string) => void;
  setMode: (mode: SelectionMode) => void;
  toggleStop: (id: string) => void;
  savePackages: (id: string, packages: number) => void;
  setInstructions: (id: string, text: string) => void;
  clearInstructions: (id: string) => void;
  removeStop: (id: string) => void;
  newRoute: () => void;
  submit: () => Promise<SubmitResult>;
  retryUnknown: (expected: UnknownSubmission) => Promise<SubmitResult>;
  isInteractionLocked: () => boolean;
}

const RouteBuilderContext = createContext<RouteBuilderContextValue | null>(
  null,
);

export function RouteBuilderProvider({ children }: { children: ReactNode }) {
  const [state, reactDispatch] = useReducer(
    routeBuilderReducer,
    undefined,
    createInitialState,
  );
  // The ref tracks queued actions too, so callbacks in one event do not read a
  // pre-render snapshot. Both transitions use the same pure reducer.
  const latest = useRef(state);
  const active = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const submissionSequence = useRef(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback((action: RouteBuilderAction) => {
    if (!mounted.current) return;
    latest.current = routeBuilderReducer(latest.current, action);
    reactDispatch(action);
  }, []);

  // Establish the lifecycle flag before a child's passive load effect, including
  // Strict Mode's development cleanup/remount cycle.
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestSequence.current += 1;
      active.current?.abort();
      if (searchTimer.current !== null) clearTimeout(searchTimer.current);
    };
  }, []);

  const loadStops = useCallback(
    async (options: LoadOptions = {}) => {
      if (!mounted.current) return;
      if (searchTimer.current !== null) {
        clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
      const query = (options.query ?? latest.current.catalogue.query).trim();
      active.current?.abort();
      const requestId = ++requestSequence.current;
      const controller = new AbortController();
      active.current = controller;
      const catalogue = latest.current.catalogue;
      const progress =
        catalogue.progress?.query === query ? catalogue.progress : null;
      send({
        type: "catalogueStarted",
        requestId,
        query,
        resume: progress !== null,
      });
      try {
        if (query === "" && catalogue.browseLoaded && !options.force
          && catalogue.status !== "error" && progress === null) {
          send({ type: "catalogueReady", requestId, stops: catalogue.browse });
          return;
        }
        const retryAt = Math.max(latest.current.retryAt ?? 0, apiClient.getRetryAt() ?? 0);
        if (retryAt > Date.now())
          throw new ApiFailure("cooldown", "Please wait before trying again.", {
            retryAt,
          });
        const stops = await listStops(query, {
          signal: controller.signal,
          progress,
          onProgress: (next) => {
            if (mounted.current && requestId === requestSequence.current) {
              send({ type: "catalogueProgress", requestId, progress: next });
            }
          },
        });
        if (mounted.current && requestId === requestSequence.current) {
          send({ type: "catalogueReady", requestId, stops });
        }
      } catch (error) {
        if (
          error instanceof RequestCancelled ||
          !mounted.current ||
          requestId !== requestSequence.current
        )
          return;
        const failure =
          error instanceof ApiFailure
            ? error
            : new ApiFailure("protocol", "Unable to load the stop directory.");
        send({ type: "catalogueFailed", requestId, error: failure });
      } finally {
        if (active.current === controller) active.current = null;
      }
    },
    [send],
  );

  const isInteractionLocked = useCallback(
    () => inFlight.current || draftIsLocked(latest.current),
    [],
  );

  const search = useCallback((text: string) => {
    if (!mounted.current || isInteractionLocked()) return;
    const query = text.trim();
    const catalogue = latest.current.catalogue;
    if (query === catalogue.query && catalogue.status !== "idle") return;
    if (searchTimer.current !== null) clearTimeout(searchTimer.current);
    searchTimer.current = null;
    active.current?.abort();
    // Invalidate responses immediately, including the 400ms debounce window.
    const requestId = ++requestSequence.current;
    send({ type: "catalogueStarted", requestId, query, resume: false });
    if (query === "" && catalogue.browseLoaded) {
      send({ type: "catalogueReady", requestId, stops: catalogue.browse });
      return;
    }
    const retryAt = Math.max(latest.current.retryAt ?? 0, apiClient.getRetryAt() ?? 0);
    if (retryAt > Date.now()) {
      send({ type: "catalogueFailed", requestId,
        error: new ApiFailure("cooldown", "Please wait before trying again.", { retryAt }) });
      return;
    }
    searchTimer.current = setTimeout(() => {
      searchTimer.current = null;
      if (mounted.current && requestId === requestSequence.current) void loadStops({ query });
    }, apiConfig.debounceMs);
  }, [isInteractionLocked, loadStops, send]);

  const sendRoute = useCallback(async (expected?: UnknownSubmission): Promise<SubmitResult> => {
    if (!mounted.current || inFlight.current) return "blocked";
    const previous = latest.current.submission;
    // Confirmation authorizes exactly this unknown outcome, not a later failure.
    const confirmedUnknown = previous.status === "unknown" && expected !== undefined
      && previous.attemptId === expected.attemptId && previous.error === expected.error;
    if ((expected !== undefined && !confirmedUnknown)
      || (isInteractionLocked() && !confirmedUnknown)) return "blocked";
    const validation = validateDraft(latest.current.draft);
    if (!validation.valid) {
      send({ type: "validationFailed", validation });
      return "invalid";
    }
    const now = Date.now();
    const retryAt = Math.max(
      latest.current.retryAt ?? 0,
      apiClient.getRetryAt() ?? 0,
    );
    if (retryAt > now) return "blocked";
    // Set before dispatch and before the first await: two calls in one frame
    // must never issue two POSTs. The reducer also freezes the request snapshot.
    inFlight.current = true;
    send({ type: "submissionStarted", startedAt: now, attemptId: ++submissionSequence.current, confirmedUnknown });
    const pending = latest.current.submission;
    if (pending.status !== "sending") {
      inFlight.current = false;
      return "blocked";
    }
    try {
      const route = await createRoute(pending.snapshot);
      send({ type: "submissionSucceeded", route });
      return "success";
    } catch (error) {
      const failure =
        error instanceof ApiFailure
          ? error
          : new ApiFailure("protocol", "The route could not be confirmed.", {
              outcome: "unknown",
            });
      send({ type: "submissionFailed", error: failure });
      return "failed";
    } finally {
      inFlight.current = false;
    }
  }, [isInteractionLocked, send]);

  const submit = useCallback(() => sendRoute(), [sendRoute]);
  const retryUnknown = useCallback((expected: UnknownSubmission) => sendRoute(expected), [sendRoute]);

  const actions = useMemo(
    () => ({
      setMode: (mode: SelectionMode) => send({ type: "setMode", mode }),
      toggleStop: (id: string) => send({ type: "toggleStop", id }),
      savePackages: (id: string, packages: number) =>
        send({ type: "savePackages", id, packages }),
      setInstructions: (id: string, text: string) =>
        send({ type: "setInstructions", id, text }),
      clearInstructions: (id: string) =>
        send({ type: "clearInstructions", id }),
      removeStop: (id: string) => send({ type: "removeStop", id }),
      newRoute: () => send({ type: "newRoute" }),
    }),
    [send],
  );

  const value = useMemo(
    () => ({ state, loadStops, search, submit, retryUnknown, isInteractionLocked, ...actions }),
    [state, loadStops, search, submit, retryUnknown, isInteractionLocked, actions],
  );
  return (
    <RouteBuilderContext.Provider value={value}>
      {children}
    </RouteBuilderContext.Provider>
  );
}

export function useRouteBuilder(): RouteBuilderContextValue {
  const context = useContext(RouteBuilderContext);
  if (!context)
    throw new Error(
      "useRouteBuilder must be used inside RouteBuilderProvider.",
    );
  return context;
}
