import type { ApiFailure, CatalogueProgress, CreatedRoute, Draft, DraftValidation, RouteBuilderState, SelectionMode, Stop } from '../types/domain';
import { createSnapshot, validInstructionInput, validPackages, validateDraft } from './validation';

const emptyValidation = (): DraftValidation => ({ valid: true, errorsByStopId: {}, routeError: null });

export function createInitialState(): RouteBuilderState {
  return {
    retryAt: null,
    draft: { mode: 'one', selected: [] },
    catalogue: {
      browse: [], browseLoaded: false, results: [], query: '', status: 'idle',
      activeRequestId: 0, error: null, progress: null,
    },
    submission: { status: 'idle', validation: emptyValidation() },
  };
}

export type RouteBuilderAction =
  | { type: 'setMode'; mode: SelectionMode }
  | { type: 'toggleStop'; id: string }
  | { type: 'savePackages'; id: string; packages: number }
  | { type: 'setInstructions'; id: string; text: string }
  | { type: 'clearInstructions'; id: string }
  | { type: 'removeStop'; id: string }
  | { type: 'catalogueStarted'; requestId: number; query: string; resume: boolean }
  | { type: 'catalogueProgress'; requestId: number; progress: CatalogueProgress }
  | { type: 'catalogueReady'; requestId: number; stops: readonly Stop[] }
  | { type: 'catalogueFailed'; requestId: number; error: ApiFailure }
  | { type: 'validationFailed'; validation: DraftValidation }
  | { type: 'submissionStarted'; startedAt: number; confirmedUnknown?: boolean }
  | { type: 'submissionSucceeded'; route: CreatedRoute }
  | { type: 'submissionFailed'; error: ApiFailure }
  | { type: 'newRoute' };

export function draftIsLocked(state: RouteBuilderState): boolean {
  return ['sending', 'unknown', 'success'].includes(state.submission.status);
}

function changeDraft(state: RouteBuilderState, draft: Draft): RouteBuilderState {
  const previous = state.submission;
  const hadErrors = (previous.status === 'idle' || previous.status === 'error')
    && (!previous.validation.valid || Object.keys(previous.validation.errorsByStopId).length > 0);
  return {
    ...state, draft,
    submission: { status: 'idle', validation: hadErrors ? validateDraft(draft) : emptyValidation() },
  };
}

export function routeBuilderReducer(state: RouteBuilderState, action: RouteBuilderAction): RouteBuilderState {
  const catalogue = state.catalogue;
  switch (action.type) {
    case 'catalogueStarted':
      if (action.requestId <= catalogue.activeRequestId) return state;
      return {
        ...state,
        catalogue: {
          ...catalogue, query: action.query, status: 'loading', error: null,
          activeRequestId: action.requestId,
          results: catalogue.query === action.query ? catalogue.results : [],
          progress: action.resume && catalogue.progress?.query === action.query ? catalogue.progress : null,
        },
      };
    case 'catalogueProgress':
      if (action.requestId !== catalogue.activeRequestId || catalogue.status !== 'loading'
        || action.progress.query !== catalogue.query) return state;
      return { ...state, catalogue: { ...catalogue, progress: action.progress } };
    case 'catalogueReady':
      if (action.requestId !== catalogue.activeRequestId || catalogue.status !== 'loading') return state;
      return {
        ...state, catalogue: {
          ...catalogue, results: action.stops, status: 'ready', error: null, progress: null,
          ...(catalogue.query === '' ? { browse: action.stops, browseLoaded: true } : {}),
        },
      };
    case 'catalogueFailed':
      if (action.requestId !== catalogue.activeRequestId || catalogue.status !== 'loading') return state;
      return {
        ...state,
        retryAt: action.error.retryAt === null ? state.retryAt : Math.max(state.retryAt ?? 0, action.error.retryAt),
        catalogue: { ...catalogue, status: 'error', error: action.error },
      };
    case 'setMode':
      if (draftIsLocked(state)) return state;
      return changeDraft(state, { mode: action.mode, selected: action.mode === 'one' ? state.draft.selected.slice(0, 1) : state.draft.selected });
    case 'toggleStop': {
      if (draftIsLocked(state)) return state;
      const selected = state.draft.selected;
      if (selected.some(item => item.stop.id === action.id)) {
        return changeDraft(state, { ...state.draft, selected: selected.filter(item => item.stop.id !== action.id) });
      }
      const stop = [...catalogue.browse, ...catalogue.results, ...(catalogue.progress?.collected ?? [])]
        .find(item => item.id === action.id);
      if (!stop) return state;
      const item = { stop, packages: 1, instructions: '' };
      return changeDraft(state, { ...state.draft, selected: state.draft.mode === 'one' ? [item] : [...selected, item] });
    }
    case 'removeStop':
      if (draftIsLocked(state)) return state;
      return changeDraft(state, { ...state.draft, selected: state.draft.selected.filter(item => item.stop.id !== action.id) });
    case 'savePackages':
    case 'setInstructions':
    case 'clearInstructions': {
      if (draftIsLocked(state)) return state;
      const target = state.draft.selected.find(item => item.stop.id === action.id);
      if (!target) return state;
      if (action.type === 'savePackages' && !validPackages(target.stop, action.packages)) return state;
      if (action.type === 'setInstructions' && !validInstructionInput(action.text)) return state;
      const selected = state.draft.selected.map(item => item.stop.id !== action.id ? item
        : action.type === 'savePackages' ? { ...item, packages: action.packages }
        : { ...item, instructions: action.type === 'clearInstructions' ? '' : action.text });
      return changeDraft(state, { ...state.draft, selected });
    }
    case 'validationFailed':
      if (draftIsLocked(state)) return state;
      return { ...state, submission: { status: 'idle', validation: action.validation } };
    case 'submissionStarted': {
      if (state.submission.status === 'sending' || state.submission.status === 'success'
        || (state.submission.status === 'unknown' && !action.confirmedUnknown)) return state;
      if (state.retryAt !== null && state.retryAt > action.startedAt) return state;
      const previousError = state.submission.status === 'error' || state.submission.status === 'unknown'
        ? state.submission.error : null;
      if (previousError?.retryAt !== null && previousError?.retryAt !== undefined
        && previousError.retryAt > action.startedAt) return state;
      const validation = validateDraft(state.draft);
      if (!validation.valid) return { ...state, submission: { status: 'idle', validation } };
      return { ...state, submission: { status: 'sending', snapshot: createSnapshot(state.draft.selected), startedAt: action.startedAt } };
    }
    case 'submissionSucceeded':
      if (state.submission.status !== 'sending') return state;
      return { ...state, submission: { status: 'success', route: action.route } };
    case 'submissionFailed':
      if (state.submission.status !== 'sending') return state;
      return {
        ...state,
        retryAt: action.error.retryAt === null ? state.retryAt : Math.max(state.retryAt ?? 0, action.error.retryAt),
        submission: action.error.outcome === 'unknown'
          ? { status: 'unknown', snapshot: state.submission.snapshot, error: action.error, receivedRouteId: action.error.receivedRouteId }
          : { status: 'error', snapshot: state.submission.snapshot, error: action.error, validation: emptyValidation() },
      };
    case 'newRoute':
      if (state.submission.status !== 'success') return state;
      return { ...state, draft: { mode: 'one', selected: [] }, submission: { status: 'idle', validation: emptyValidation() } };
  }
}
