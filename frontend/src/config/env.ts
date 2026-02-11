const rawApiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/';

export const config = {
  apiUrl: rawApiUrl,
  geocodingUrl: 'https://geocoding-api.open-meteo.com/v1/search'
} as const;

export function validateEnv(): void {
  if (!config.apiUrl.startsWith('http://') && !config.apiUrl.startsWith('https://')) {
    throw new Error('VITE_API_URL must be an absolute http(s) URL');
  }
}
