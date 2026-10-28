import { ApiFailure, type Stop } from '../types/domain';
import type { ApiErrorDto, CreateRouteResponseDto, RouteStopDto, StopDto, StopsPageDto } from '../types/dto';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(): never {
  throw new ApiFailure('protocol', 'The service returned an invalid response.');
}

function string(value: unknown, nonempty = false): string {
  if (typeof value !== 'string' || (nonempty && value.trim().length === 0)) invalid();
  return value;
}

function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) invalid();
  return value;
}

export function normalizePackagesMax(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value.trim()))) invalid();
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1) invalid();
  return result;
}

export function decodeStop(value: unknown): StopDto {
  if (!isRecord(value)) invalid();
  const maximum = value.packages_max;
  normalizePackagesMax(maximum);
  if (maximum !== null && typeof maximum !== 'number' && typeof maximum !== 'string') invalid();
  const delivery = value.last_delivery_at;
  if (typeof delivery !== 'string' && (typeof delivery !== 'number' || !Number.isFinite(delivery))) invalid();
  if (value.notes !== undefined && value.notes !== null && typeof value.notes !== 'string') invalid();
  return {
    id: string(value.id, true), name: string(value.name),
    address: string(value.address), phone: string(value.phone),
    zone: string(value.zone), packages_max: maximum, last_delivery_at: delivery,
    ...(value.notes === undefined ? {} : { notes: value.notes }),
  };
}

export function toStop(dto: StopDto): Stop {
  return {
    id: dto.id, name: dto.name, address: dto.address, phone: dto.phone,
    packagesMax: normalizePackagesMax(dto.packages_max),
  };
}

export function decodeStopsPage(value: unknown): StopsPageDto {
  if (!isRecord(value)) invalid();
  if (value.items !== null && !Array.isArray(value.items)) invalid();
  if (typeof value.has_more !== 'boolean') invalid();
  return {
    items: value.items === null ? [] : value.items.map(decodeStop),
    page: number(value.page), page_size: number(value.page_size),
    total: number(value.total), total_pages: number(value.total_pages), has_more: value.has_more,
  };
}

function decodeRouteStop(value: unknown): RouteStopDto {
  if (!isRecord(value)) invalid();
  const packages = number(value.packages);
  if (!Number.isSafeInteger(packages) || packages < 1) invalid();
  return { stop_id: string(value.stop_id, true), packages, instructions: string(value.instructions) };
}

export function decodeCreatedRoute(value: unknown): CreateRouteResponseDto {
  if (!isRecord(value) || value.status !== 'draft' || !Array.isArray(value.stops) || value.stops.length === 0) invalid();
  return { id: string(value.id, true), status: 'draft', stops: value.stops.map(decodeRouteStop) };
}

// Error bodies are best-effort: a broken error payload must not hide HTTP status.
export function decodeApiError(value: unknown): ApiErrorDto | null {
  if (!isRecord(value) || typeof value.error !== 'string') return null;
  const fields: Record<string, string> = {};
  if (isRecord(value.fields)) {
    for (const [key, message] of Object.entries(value.fields)) {
      if (typeof message === 'string') Object.defineProperty(fields, key, { value: message, enumerable: true });
    }
  }
  return {
    error: value.error, fields,
    ...(typeof value.request_id === 'string' ? { request_id: value.request_id } : {}),
    ...(typeof value.detail === 'string' ? { detail: value.detail } : {}),
  };
}
