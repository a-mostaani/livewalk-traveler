import { MAPBOX_TOKEN } from './config';
import type { Place } from './types';

type Feature = {
  id?: string;
  geometry?: { coordinates?: unknown };
  properties?: { full_address?: string; name_preferred?: string };
  place_formatted?: string;
};

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  if (!MAPBOX_TOKEN) throw new Error('Place search is unavailable in this build.');
  const params = new URLSearchParams({ q: query, autocomplete: 'true', limit: '5', access_token: MAPBOX_TOKEN });
  let response: Response;
  try {
    response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, { signal });
  } catch (reason) {
    if ((reason as { name?: string }).name === 'AbortError') throw reason;
    throw new Error('Could not reach place search. Check your connection and retry.');
  }
  if (response.status === 429) throw new Error('Place search is busy. Try again shortly.');
  if (response.status === 401 || response.status === 403) throw new Error('Place search is not authorized for this site.');
  if (!response.ok) throw new Error('Place search is temporarily unavailable.');
  const payload = await response.json() as { features?: Feature[] };
  return (payload.features || []).flatMap((feature) => {
    const coordinates = feature.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
    const lng = Number(coordinates[0]);
    const lat = Number(coordinates[1]);
    const label = String(feature.properties?.full_address || feature.place_formatted || feature.properties?.name_preferred || '').trim();
    return label && Number.isFinite(lat) && Number.isFinite(lng) ? [{ label, lat, lng }] : [];
  });
}
