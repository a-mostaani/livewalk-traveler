const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';
const COMMITTED_PUBLIC_MOBILE_MAPBOX_TOKEN = 'pk.eyJ1IjoiYS1tb3N0IiwiYSI6ImNtcmh0M2s2ODFmbHAyeHF6N3k2NjNzdHAifQ.fC7tosE6isRH40dtUXq2Vw';
const QA_BUILD_CHANNEL = 'qa';

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

function resolveQaBuildMetadata(env = process.env) {
  if (env.LIVEWALK_BUILD_CHANNEL?.trim() !== QA_BUILD_CHANNEL) return undefined;

  const commit = env.LIVEWALK_BUILD_COMMIT?.trim().slice(0, 7);
  const branch = env.LIVEWALK_BUILD_BRANCH?.trim();
  const purpose = env.LIVEWALK_BUILD_PURPOSE?.trim();

  if (!commit || !branch || !purpose) return undefined;

  return {
    commit,
    branch,
    purpose,
    label: `QA BUILD · ${commit} · ${branch} · ${purpose}`,
  };
}

function createAppConfig(config, env = process.env) {
  const apiBaseUrl = cleanUrl(
    env.LIVEWALK_API_BASE_URL ?? env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const livekitWsUrl = cleanUrl(env.LIVEKIT_WS_URL?.trim() ?? '');
  const mapboxTokenWeb = env.MAPBOX_TOKEN_WEB?.trim() ?? '';
  const mobileMapbox = resolveMobileMapboxToken();
  const qaBuild = resolveQaBuildMetadata(env);

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
      ...(qaBuild ? { qaBuild } : {}),
    },
  };
}

function appConfig({ config }) {
  return createAppConfig(config);
}

appConfig.createAppConfig = createAppConfig;
appConfig.resolveQaBuildMetadata = resolveQaBuildMetadata;

module.exports = appConfig;
