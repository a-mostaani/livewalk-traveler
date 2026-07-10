import Constants from 'expo-constants';

type LiveWalkExtra = {
  apiBaseUrl?: string;
  mapboxPublicToken?: string;
};

function getLiveWalkExtra(): LiveWalkExtra {
  return (Constants.expoConfig?.extra ?? {}) as LiveWalkExtra;
}

function cleanApiBaseUrl(value: string | undefined): string {
  const cleaned = value?.trim().replace(/\/+$/, '');
  if (!cleaned) throw new Error('LiveWalk API base URL is missing from Expo config.');
  return cleaned;
}

const liveWalkExtra = getLiveWalkExtra();

export const API_BASE = cleanApiBaseUrl(liveWalkExtra.apiBaseUrl);
export const MAPBOX_PUBLIC_TOKEN = liveWalkExtra.mapboxPublicToken?.trim() ?? '';
