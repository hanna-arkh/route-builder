import { apiConfig, type ApiConfig } from '../config/api';
import { ApiFailure, RequestCancelled } from '../types/domain';
import { decodeApiError } from './decoders';

type ApiPath = '/v1/stops' | '/v1/routes';
interface RequestOptions {
  readonly method?: 'GET' | 'POST';
  readonly query?: URLSearchParams;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}

export function parseRetryAt(value: string | null, now: number, fallbackSeconds: number): number {
  const text = value?.trim() ?? '';
  if (/^\d+(\.\d+)?$/.test(text)) {
    const seconds = Number(text);
    if (Number.isFinite(seconds)) return now + seconds * 1000;
  }
  // Avoid treating malformed numeric headers as calendar dates.
  if (/[a-z]/i.test(text)) {
    const date = Date.parse(text);
    if (Number.isFinite(date)) return Math.max(now, date);
  }
  return now + fallbackSeconds * 1000;
}

export function createApiClient(
  config: ApiConfig = apiConfig,
  transport: typeof fetch = (input, init) => fetch(input, init),
  now: () => number = Date.now,
) {
  let cooldownUntil: number | null = null;

  function getRetryAt(): number | null {
    if (cooldownUntil !== null && cooldownUntil <= now()) cooldownUntil = null;
    return cooldownUntil;
  }

  async function request(path: ApiPath, options: RequestOptions = {}): Promise<{ status: number; data: unknown }> {
    if (options.signal?.aborted) throw new RequestCancelled();
    const retryAt = getRetryAt();
    if (retryAt !== null) {
      throw new ApiFailure('cooldown', 'Please wait before trying again.', { retryAt });
    }
    const method = options.method ?? 'GET';
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    options.signal?.addEventListener('abort', cancel);
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, config.requestTimeoutMs);

    try {
      const url = new URL(path, config.baseUrl);
      if (options.query) url.search = options.query.toString();
      const response = await transport(url.toString(), {
        method,
        headers: { Accept: 'application/json', ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
        signal: controller.signal,
      });
      if (response.status === 429 || response.status === 503) {
        const deadline = parseRetryAt(response.headers.get('Retry-After'), now(), config.retryAfterFallbackSeconds);
        cooldownUntil = Math.max(cooldownUntil ?? 0, deadline);
      }
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        if (controller.signal.aborted) throw new RequestCancelled();
        if (response.ok) {
          throw new ApiFailure('protocol', 'The service returned unreadable data.', {
            httpStatus: response.status, outcome: method === 'POST' ? 'unknown' : 'rejected',
          });
        }
        data = null;
      }
      if (controller.signal.aborted) throw new RequestCancelled();
      if (!response.ok) {
        const error = decodeApiError(data);
        const message = response.status === 429 ? 'Too many requests. Please wait before trying again.'
          : response.status === 503 ? 'The service is temporarily unavailable. Please try again later.'
          : response.status === 422 ? 'Check the route details before trying again.'
          : response.status === 400 ? 'The request could not be accepted. Check the route details.'
          : 'The service could not complete the request. Please try again.';
        throw new ApiFailure('http', message, {
          httpStatus: response.status, code: error?.error,
          fields: error?.fields, requestId: error?.request_id, retryAt: getRetryAt(),
          outcome: method === 'POST' && response.status >= 500 ? 'unknown' : 'rejected',
        });
      }
      return { status: response.status, data };
    } catch (error) {
      if (options.signal?.aborted) throw new RequestCancelled();
      if (timedOut) {
        throw new ApiFailure('timeout', 'The request timed out. Please check the connection.', {
          outcome: method === 'POST' ? 'unknown' : 'rejected', retryAt: getRetryAt(),
        });
      }
      if (error instanceof ApiFailure || error instanceof RequestCancelled) throw error;
      throw new ApiFailure('network', 'Unable to reach the service. Check the API address and connection.', {
        outcome: method === 'POST' ? 'unknown' : 'rejected',
      });
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', cancel);
    }
  }

  return { request, getRetryAt };
}

export type ApiClient = ReturnType<typeof createApiClient>;
export const apiClient = createApiClient();
