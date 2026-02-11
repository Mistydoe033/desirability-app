import { config } from '../../config/env';
import { GeoLocation } from '../../types';

interface GeocodingResponse {
  results?: Array<{
    name: string;
    admin1?: string;
    country?: string;
    latitude: number;
    longitude: number;
  }>;
}

function toLabel(result: GeocodingResponse['results'][number]): string {
  const parts = [result.name];
  if (result.admin1) {
    parts.push(result.admin1);
  }
  if (result.country) {
    parts.push(result.country);
  }
  return parts.join(', ');
}

export async function searchLocations(query: string, signal?: AbortSignal): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    name: trimmed,
    count: '6',
    language: 'en',
    format: 'json'
  });

  const response = await fetch(`${config.geocodingUrl}?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GeocodingResponse;
  const results = payload.results ?? [];

  return results.map((result) => ({
    id: `${result.latitude}:${result.longitude}:${result.name}`,
    label: toLabel(result),
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country
  }));
}
