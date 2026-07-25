import {
  APPROVED_PRODUCTION_LIVEKIT_WS_URL,
  resolveLiveKitBuildUrl,
  resolveMapboxBuildToken,
} from './buildConfig';

test('wires MAPBOX_TOKEN_WEB into the production browser build input', () => {
  expect(resolveMapboxBuildToken('production', {
    MAPBOX_TOKEN_WEB: '  pk.test-public-token  ',
  })).toBe('pk.test-public-token');
});

test('fails a production bundle when the web Mapbox token is missing', () => {
  expect(() => resolveMapboxBuildToken('production', {}))
    .toThrow('Production web build requires MAPBOX_TOKEN_WEB.');
});

test('keeps tokenless local and test modes available', () => {
  expect(resolveMapboxBuildToken('development', {})).toBe('');
  expect(resolveMapboxBuildToken('test', {})).toBe('');
});

test('maps the approved public LiveKit URL into production builds', () => {
  expect(resolveLiveKitBuildUrl('production', {}))
    .toBe(APPROVED_PRODUCTION_LIVEKIT_WS_URL);

  expect(resolveLiveKitBuildUrl('production', {
    LIVEKIT_WS_URL: `  ${APPROVED_PRODUCTION_LIVEKIT_WS_URL}  `,
  })).toBe(APPROVED_PRODUCTION_LIVEKIT_WS_URL);
});

test('rejects the retired LiveKit project from production builds', () => {
  expect(() => resolveLiveKitBuildUrl('production', {
    LIVEKIT_WS_URL: 'wss://livewalk-test.livekit.cloud',
  })).toThrow('Production web build rejects retired LiveKit host livewalk-test.livekit.cloud.');
});

test('rejects every non-approved LiveKit project from production builds', () => {
  expect(() => resolveLiveKitBuildUrl('production', {
    LIVEKIT_WS_URL: 'wss://another-project.livekit.cloud',
  })).toThrow('Production web build requires approved LiveKit host livelywalk-ef00mosq.livekit.cloud.');

  expect(() => resolveLiveKitBuildUrl('production', {
    LIVEKIT_WS_URL: 'https://livelywalk-ef00mosq.livekit.cloud',
  })).toThrow('Production web build requires approved LiveKit host livelywalk-ef00mosq.livekit.cloud.');
});

test('keeps LiveKit-free local and test modes available', () => {
  expect(resolveLiveKitBuildUrl('development', {})).toBe('');
  expect(resolveLiveKitBuildUrl('test', {})).toBe('');
});
