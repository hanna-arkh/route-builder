import { ApiFailure, type CreatedRoute, type RouteSnapshot } from '../types/domain';
import type { CreateRouteRequestDto } from '../types/dto';
import { apiClient, type ApiClient } from './client';
import { decodeCreatedRoute, isRecord } from './decoders';

export async function createRoute(snapshot: RouteSnapshot, client: ApiClient = apiClient): Promise<CreatedRoute> {
  const ids = new Set<string>();
  const body: CreateRouteRequestDto = {
    stops: snapshot.map(({ stop, packages, instructions }) => {
      if (!stop.id.trim() || ids.has(stop.id) || !Number.isSafeInteger(packages) || packages < 1
        || (stop.packagesMax !== null && packages > stop.packagesMax)
        || !instructions.trim() || instructions.length > 200) {
        throw new ApiFailure('protocol', 'Check the route details before sending.');
      }
      ids.add(stop.id);
      return { stop_id: stop.id, packages, instructions };
    }),
  };
  if (body.stops.length === 0) throw new ApiFailure('protocol', 'Select at least one stop.');
  const response = await client.request('/v1/routes', { method: 'POST', body });
  const receivedRouteId = isRecord(response.data) && typeof response.data.id === 'string'
    && response.data.id.trim() ? response.data.id : null;
  try {
    if (response.status !== 201) throw new Error('Unexpected status');
    const result = decodeCreatedRoute(response.data);
    if (result.stops.length !== body.stops.length || result.stops.some((item, index) => {
      const sent = body.stops[index];
      return item.stop_id !== sent.stop_id || item.packages !== sent.packages || item.instructions !== sent.instructions;
    })) throw new Error('Mismatched acknowledgement');
    return {
      id: result.id, status: 'draft',
      stops: result.stops.map(item => ({ stopId: item.stop_id, packages: item.packages, instructions: item.instructions })),
    };
  } catch {
    throw new ApiFailure('protocol', 'The route result could not be confirmed. It may already have been created.', {
      httpStatus: response.status, outcome: 'unknown', receivedRouteId,
    });
  }
}
