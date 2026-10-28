export interface StopDto {
  id: string;
  name: string;
  address: string;
  phone: string;
  zone: string;
  packages_max: number | string | null;
  last_delivery_at: string | number;
  notes?: string | null;
}

export interface StopsPageDto {
  items: StopDto[] | null;
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

export interface RouteStopDto {
  stop_id: string;
  packages: number;
  instructions: string;
}

export interface CreateRouteRequestDto {
  stops: RouteStopDto[];
}

export interface CreateRouteResponseDto {
  id: string;
  stops: RouteStopDto[];
  status: 'draft';
}

export interface ApiErrorDto {
  error: string;
  fields?: Record<string, string>;
  request_id?: string;
  detail?: string;
}
