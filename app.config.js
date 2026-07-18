const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';
const COMMITTED_PUBLIC_MOBILE_MAPBOX_TOKEN = 'pk.eyJ1IjoiYS1tb3N0IiwiYSI6ImNtcmh0M2s2ODFmbHAyeHF6N3k2NjNzdHAifQ.fC7tosE6isRH40dtUXq2Vw';

function cleanUrl(value) {
  return value.replace(/\/+$/, '');
}

function isPublicMapboxToken(value) {
  return value.length >= 20 && /^pk\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}

function resolveMobileMapboxToken() {
  const override = process.env.MAPBOX_TOKEN_MOBILE?.trim() ?? '';
  const fallback = COMMITTED_PUBLIC_MOBILE_MAPBOX_TOKEN.trim();

  if (isPublicMapboxToken(override)) {
    return { token: override, source: 'environment', diagnostic: '' };
  }

  if (isPublicMapboxToken(fallback)) {
    return {
      token: fallback,
      source: 'committed-fallback',
      diagnostic: override ? 'MAPBOX_TOKEN_MOBILE is invalid; using the committed public mobile token.' : '',
    };
  }

  return {
    token: '',
    source: 'unavailable',
    diagnostic: 'Mapbox place search is unavailable because no valid public mobile token is configured.',
  };
}

module.exports = ({ config }) => {
  const apiBaseUrl = cleanUrl(
    process.env.LIVEWALK_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const livekitWsUrl = cleanUrl(process.env.LIVEKIT_WS_URL?.trim() ?? '');
  const mapboxTokenWeb = process.env.MAPBOX_TOKEN_WEB?.trim() ?? '';
  const mobileMapbox = resolveMobileMapboxToken();

  return {
    ...config,
    name: 'LivelyWalk Traveler',
    slug: 'livewalk-traveler',
    version: '0.1.0',
    orientation: 'portrait',
    scheme: 'livewalk',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    android: {
      package: 'com.livewalk.traveler',
      adaptiveIcon: {
        backgroundColor: '#061826',
      },
    },
    ios: {
      supportsTablet: true,
    },
    web: {
      bundler: 'metro',
    },
    extra: {
      ...config.extra,
      apiBaseUrl,
      livekitWsUrl,
      mapboxTokenWeb,
      mapboxTokenMobile: mobileMapbox.token,
      mapboxTokenMobileSource: mobileMapbox.source,
      mapboxTokenMobileDiagnostic: mobileMapbox.diagnostic,
    },
  };
};
