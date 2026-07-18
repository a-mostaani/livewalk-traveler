const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';

function cleanUrl(value) {
  return value.replace(/\/+$/, '');
}

function requiredMobileMapboxToken() {
  const token = process.env.MAPBOX_TOKEN_MOBILE?.trim() ?? '';
  const valid = token.startsWith('pk.') && token.length >= 20 && !token.includes('your_mapbox_public_token_here');

  if (!valid) {
    throw new Error('MAPBOX_TOKEN_MOBILE must be a valid public Mapbox token in the selected build environment.');
  }

  return token;
}

module.exports = ({ config }) => {
  const apiBaseUrl = cleanUrl(
    process.env.LIVEWALK_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const livekitWsUrl = cleanUrl(process.env.LIVEKIT_WS_URL?.trim() ?? '');
  const mapboxTokenWeb = process.env.MAPBOX_TOKEN_WEB?.trim() ?? '';
  const mapboxTokenMobile = requiredMobileMapboxToken();

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
      mapboxTokenMobile,
      mapboxTokenMobileSource: 'environment',
    },
  };
};
