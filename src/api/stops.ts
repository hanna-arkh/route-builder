import { apiConfig } from '../config/api';
import { ApiFailure, RequestCancelled, type CatalogueProgress, type Stop } from '../types/domain';
import { apiClient, type ApiClient } from './client';
import { decodeStopsPage, toStop } from './decoders';

export interface ListStopsOptions {
  readonly signal?: AbortSignal;
  readonly progress?: CatalogueProgress | null;
  readonly onProgress?: (progress: CatalogueProgress) => void;
}

export async function listStops(
  query = '', options: ListStopsOptions = {}, client: ApiClient = apiClient,
): Promise<readonly Stop[]> {
  const q = query.trim();
  const resume = options.progress?.query === q ? options.progress : null;
  const byId = new Map<string, Stop>((resume?.collected ?? []).map(stop => [stop.id, stop]));
  let page = resume?.nextPage ?? 1;
  if (!Number.isSafeInteger(page) || page < 1) throw new ApiFailure('protocol', 'Invalid page progress.');

  while (true) {
    if (options.signal?.aborted) throw new RequestCancelled();
    const params = new URLSearchParams({ page: String(page), page_size: String(apiConfig.pageSize) });
    if (q) params.set('q', q);
    const response = await client.request('/v1/stops', { query: params, signal: options.signal });
    if (response.status !== 200) throw new ApiFailure('protocol', 'The service returned an unexpected list response.');
    const decoded = decodeStopsPage(response.data);
    const items = decoded.items ?? [];
    const before = byId.size;
    for (const dto of items) if (!byId.has(dto.id)) byId.set(dto.id, toStop(dto));
    const collected = [...byId.values()];
    if (options.signal?.aborted) throw new RequestCancelled();
    if (items.length < apiConfig.pageSize || byId.size === before) return collected;
    page += 1;
    options.onProgress?.({ query: q, nextPage: page, collected });
  }
}
