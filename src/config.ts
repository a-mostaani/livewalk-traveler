import Constants from 'expo-constants';
import { Platform } from 'react-native';

type LiveWalkExtra = {
  apiBaseUrl?: string;
  livekitWsUrl?: string;
  mapboxTokenWeb?: string;
  mapboxTokenMobile?: string;
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
export const LIVEKIT_WS_URL = liveWalkExtra.livekitWsUrl?.trim() ?? '';
export const MAPBOX_TOKEN_WEB = liveWalkExtra.mapboxTokenWeb?.trim() ?? '';
export const MAPBOX_TOKEN_MOBILE = liveWalkExtra.mapboxTokenMobile?.trim() ?? '';
export const MAPBOX_TOKEN = Platform.OS === 'web' ? MAPBOX_TOKEN_WEB : MAPBOX_TOKEN_MOBILE;
