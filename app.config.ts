import type { ConfigContext, ExpoConfig } from 'expo/config';

declare const process: {
  env: Record<string, string | undefined>;
};

const DEFAULT_API_BASE_URL = 'https://rendezvous-livewalk-api.webpeter.com';
const DEFAULT_MAPBOX_PUBLIC_TOKEN = 'pk.eyJ1IjoiYS1tb3N0IiwiYSI6ImNtcmVscGRrZzBnZGYyeXNjNzEzdTFnbW0ifQ.xJjJX7Ruzo19l6hTHcoxCQ';

function cleanUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiBaseUrl = cleanUrl(
    process.env.LIVEWALK_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  );
  const mapboxPublicToken = (process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN ?? DEFAULT_MAPBOX_PUBLIC_TOKEN).trim();

  return {
    ...config,
    name: 'LiveWalk Traveler',
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
      mapboxPublicToken,
    },
  };
};
