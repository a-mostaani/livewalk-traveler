const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';
const EMBEDDED_MOBILE_MAPBOX_PUBLIC_TOKEN = "pk.your_mapbox_public_token_here";

function cleanUrl(value) {
  return value.replace(/\/+$/, '');
}

function resolveMobileMapboxToken() {
  const override = process.env.MAPBOX_TOKEN_MOBILE?.trim();
  const token = override ?? EMBEDDED_MOBILE_MAPBOX_PUBLIC_TOKEN;
  const source = override ? 'environment' : 'embedded fallback';
  const valid = token.startsWith('pk.') && token.length >= 20;

  if (!valid) {
    console.warn('Mapbox mobile token is missing or invalid; map features will be unavailable in this build.');
    return { token: '', source, diagnostic: 'Mapbox mobile token is missing or invalid.' };
  }

  return { token, source, diagnostic: '' };
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
