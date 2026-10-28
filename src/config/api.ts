// Simulator default. For a physical iPhone, set EXPO_PUBLIC_API_URL to the
// computer's LAN address, e.g. http://192.168.1.10:4000, then reload the app.
export const apiConfig = {
  baseUrl: (process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:4000').replace(/\/+$/, ''),
  pageSize: 50,
  debounceMs: 400,
  requestTimeoutMs: 10_000,
  retryAfterFallbackSeconds: 2,
} as const;

export interface ApiConfig {
  readonly baseUrl: string;
  readonly pageSize: number;
  readonly debounceMs: number;
  readonly requestTimeoutMs: number;
  readonly retryAfterFallbackSeconds: number;
}
