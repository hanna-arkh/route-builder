import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

import { apiClient } from '../api/client';
import { listStops } from '../api/stops';
import { ApiFailure, RequestCancelled, type RouteBuilderState, type SelectionMode } from '../types/domain';
import { createInitialState, routeBuilderReducer, type RouteBuilderAction } from './routeBuilderReducer';

interface LoadOptions {
  query?: string;
  force?: boolean;
}

interface RouteBuilderContextValue {
  state: RouteBuilderState;
  loadStops: (options?: LoadOptions) => Promise<void>;
  setMode: (mode: SelectionMode) => void;
  toggleStop: (id: string) => void;
  savePackages: (id: string, packages: number) => void;
  setInstructions: (id: string, text: string) => void;
  clearInstructions: (id: string) => void;
  removeStop: (id: string) => void;
  newRoute: () => void;
}

const RouteBuilderContext = createContext<RouteBuilderContextValue | null>(null);

export function RouteBuilderProvider({ children }: { children: ReactNode }) {
  const [state, reactDispatch] = useReducer(routeBuilderReducer, undefined, createInitialState);
  // The ref tracks queued actions too, so callbacks in one event do not read a
  // pre-render snapshot. Both transitions use the same pure reducer.
  const latest = useRef(state);
  const active = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);
  const mounted = useRef(true);

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
    };
  }, []);

  const loadStops = useCallback(async (options: LoadOptions = {}) => {
    if (!mounted.current) return;
    const query = (options.query ?? latest.current.catalogue.query).trim();
    active.current?.abort();
    const requestId = ++requestSequence.current;
    const controller = new AbortController();
    active.current = controller;
    const catalogue = latest.current.catalogue;
    const progress = catalogue.progress?.query === query ? catalogue.progress : null;
    send({ type: 'catalogueStarted', requestId, query, resume: progress !== null });
    try {
      if (query === '' && catalogue.browseLoaded && !options.force) {
        send({ type: 'catalogueReady', requestId, stops: catalogue.browse });
        return;
      }
      const retryAt = apiClient.getRetryAt();
      if (retryAt !== null) throw new ApiFailure('cooldown', 'Please wait before trying again.', { retryAt });
      const stops = await listStops(query, {
        signal: controller.signal, progress,
        onProgress: next => {
          if (mounted.current && requestId === requestSequence.current) {
            send({ type: 'catalogueProgress', requestId, progress: next });
          }
        },
      });
      if (mounted.current && requestId === requestSequence.current) {
        send({ type: 'catalogueReady', requestId, stops });
      }
    } catch (error) {
      if (error instanceof RequestCancelled || !mounted.current || requestId !== requestSequence.current) return;
      const failure = error instanceof ApiFailure ? error
        : new ApiFailure('protocol', 'Unable to load the stop directory.');
      send({ type: 'catalogueFailed', requestId, error: failure });
    } finally {
      if (active.current === controller) active.current = null;
    }
  }, [send]);

  const actions = useMemo(() => ({
    setMode: (mode: SelectionMode) => send({ type: 'setMode', mode }),
    toggleStop: (id: string) => send({ type: 'toggleStop', id }),
    savePackages: (id: string, packages: number) => send({ type: 'savePackages', id, packages }),
    setInstructions: (id: string, text: string) => send({ type: 'setInstructions', id, text }),
    clearInstructions: (id: string) => send({ type: 'clearInstructions', id }),
    removeStop: (id: string) => send({ type: 'removeStop', id }),
    newRoute: () => send({ type: 'newRoute' }),
  }), [send]);

  const value = useMemo(() => ({ state, loadStops, ...actions }), [state, loadStops, actions]);
  return <RouteBuilderContext.Provider value={value}>{children}</RouteBuilderContext.Provider>;
}

export function useRouteBuilder(): RouteBuilderContextValue {
  const context = useContext(RouteBuilderContext);
  if (!context) throw new Error('useRouteBuilder must be used inside RouteBuilderProvider.');
  return context;
}
