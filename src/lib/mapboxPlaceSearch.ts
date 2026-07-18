export type MapboxPlaceSearchCategory =
  | 'success'
  | 'empty-result'
  | 'unauthorized'
  | 'forbidden'
  | 'rate-limited'
  | 'network'
  | 'service-error';

export type MapboxPlaceSearchDiagnostic = {
  category: MapboxPlaceSearchCategory;
  message: string;
};

export function mapboxPlaceSearchUrl(query: string, accessToken: string): string {
  const params = new URLSearchParams({
    q: query,
    autocomplete: 'true',
    limit: '5',
    access_token: accessToken,
  });
  return `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`;
}

export function classifyMapboxPlaceSearch(status: number | undefined, resultCount?: number): MapboxPlaceSearchDiagnostic {
  if (status === 401) return { category: 'unauthorized', message: 'Place search authorization is unavailable in this build.' };
  if (status === 403) return { category: 'forbidden', message: 'Place search is restricted for this app.' };
  if (status === 429) return { category: 'rate-limited', message: 'Place search is busy. Please try again shortly.' };
  if (status === undefined) return { category: 'network', message: 'Could not reach place search. Check the connection and try again.' };
  if (status < 200 || status >= 300) return { category: 'service-error', message: 'Place search is temporarily unavailable. Please try again.' };
  if (resultCount === 0) return { category: 'empty-result', message: 'No matching places yet.' };
  return { category: 'success', message: '' };
}

export function isAbortError(error: unknown): boolean {
  return (error as { name?: string }).name === 'AbortError';
}
