export interface Stop {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly phone: string;
  readonly packagesMax: number | null;
}

export interface SelectedStop {
  readonly stop: Stop;
  readonly packages: number;
  readonly instructions: string;
}

export type SelectionMode = 'one' | 'multi';
export interface Draft {
  readonly mode: SelectionMode;
  readonly selected: readonly SelectedStop[];
}
export type RouteSnapshot = readonly SelectedStop[];

export interface CreatedRouteStop {
  readonly stopId: string;
  readonly packages: number;
  readonly instructions: string;
}

export interface CreatedRoute {
  readonly id: string;
  readonly stops: readonly CreatedRouteStop[];
  readonly status: 'draft';
}

export type FailureKind = 'network' | 'timeout' | 'http' | 'protocol' | 'cooldown';
export type FailureOutcome = 'rejected' | 'unknown';

export class ApiFailure extends Error {
  readonly kind: FailureKind;
  readonly httpStatus: number | null;
  readonly code: string | null;
  readonly fields: Readonly<Record<string, string>>;
  readonly requestId: string | null;
  readonly retryAt: number | null;
  readonly outcome: FailureOutcome;
  readonly receivedRouteId: string | null;

  constructor(kind: FailureKind, message: string, options: {
    httpStatus?: number | null;
    code?: string | null;
    fields?: Readonly<Record<string, string>>;
    requestId?: string | null;
    retryAt?: number | null;
    outcome?: FailureOutcome;
    receivedRouteId?: string | null;
  } = {}) {
    super(message);
    this.name = 'ApiFailure';
    this.kind = kind;
    this.httpStatus = options.httpStatus ?? null;
    this.code = options.code ?? null;
    this.fields = options.fields ?? {};
    this.requestId = options.requestId ?? null;
    this.retryAt = options.retryAt ?? null;
    this.outcome = options.outcome ?? 'rejected';
    this.receivedRouteId = options.receivedRouteId ?? null;
  }
}

// Cancellation is control flow, not a user-facing request failure.
export class RequestCancelled extends Error {
  constructor() {
    super('Request cancelled.');
    this.name = 'RequestCancelled';
  }
}

export interface CatalogueProgress {
  readonly query: string;
  readonly nextPage: number;
  readonly collected: readonly Stop[];
}

export interface CatalogueState {
  readonly browse: readonly Stop[];
  readonly browseLoaded: boolean;
  readonly results: readonly Stop[];
  readonly query: string;
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  readonly activeRequestId: number;
  readonly error: ApiFailure | null;
  readonly progress: CatalogueProgress | null;
}

export interface DraftValidation {
  readonly valid: boolean;
  readonly errorsByStopId: Readonly<Record<string, string>>;
  readonly routeError: string | null;
}

export type SubmissionState =
  | { readonly status: 'idle'; readonly validation: DraftValidation }
  | { readonly status: 'sending'; readonly attemptId: number; readonly snapshot: RouteSnapshot; readonly startedAt: number }
  | { readonly status: 'error'; readonly snapshot: RouteSnapshot; readonly error: ApiFailure; readonly validation: DraftValidation }
  | { readonly status: 'unknown'; readonly attemptId: number; readonly snapshot: RouteSnapshot; readonly error: ApiFailure; readonly receivedRouteId: string | null }
  | { readonly status: 'success'; readonly route: CreatedRoute };

export interface RouteBuilderState {
  readonly retryAt: number | null;
  readonly draft: Draft;
  readonly catalogue: CatalogueState;
  readonly submission: SubmissionState;
}
