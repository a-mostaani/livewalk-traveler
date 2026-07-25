type BuildEnvironment = Record<string, string | undefined>;

export const APPROVED_PRODUCTION_LIVEKIT_WS_URL = 'wss://livelywalk-ef00mosq.livekit.cloud';
export const APPROVED_PRODUCTION_LIVEKIT_HOSTNAME = 'livelywalk-ef00mosq.livekit.cloud';
export const RETIRED_LIVEKIT_HOSTNAME = 'livewalk-test.livekit.cloud';

export function resolveMapboxBuildToken(mode: string, env: BuildEnvironment) {
  const token = env.MAPBOX_TOKEN_WEB?.trim() || env.VITE_MAPBOX_TOKEN?.trim() || '';
  if (mode === 'production' && !token) {
    throw new Error('Production web build requires MAPBOX_TOKEN_WEB.');
  }
  return token;
}

export function resolveLiveKitBuildUrl(mode: string, env: BuildEnvironment) {
  const configuredUrl = env.LIVEKIT_WS_URL?.trim() || env.VITE_LIVEKIT_WS_URL?.trim() || '';
  const url = configuredUrl || (mode === 'production' ? APPROVED_PRODUCTION_LIVEKIT_WS_URL : '');
  if (mode !== 'production') return url;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Production web build requires a valid LIVEKIT_WS_URL.');
  }

  if (parsedUrl.hostname === RETIRED_LIVEKIT_HOSTNAME) {
    throw new Error(`Production web build rejects retired LiveKit host ${RETIRED_LIVEKIT_HOSTNAME}.`);
  }

  if (parsedUrl.protocol !== 'wss:' || parsedUrl.hostname !== APPROVED_PRODUCTION_LIVEKIT_HOSTNAME) {
    throw new Error(`Production web build requires approved LiveKit host ${APPROVED_PRODUCTION_LIVEKIT_HOSTNAME}.`);
  }

  return url;
}
