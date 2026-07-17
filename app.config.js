const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';

function cleanUrl(value) {
  return value.replace(/\/+$/, '');
}

function requiredBuildEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for native place search. Configure it in the selected EAS build environment.`);
  }
  return value;
}

module.exports = ({ config }) => {
  const apiBaseUrl = cleanUrl(
    process.env.LIVEWALK_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const livekitWsUrl = cleanUrl(process.env.LIVEKIT_WS_URL?.trim() ?? '');
  const mapboxTokenWeb = process.env.MAPBOX_TOKEN_WEB?.trim() ?? '';
  const mapboxTokenMobile = requiredBuildEnv('MAPBOX_TOKEN_MOBILE');

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
    },
  };
};
