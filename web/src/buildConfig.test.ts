import { resolveLiveKitBuildUrl, resolveMapboxBuildToken } from './buildConfig';

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

test('wires LIVEKIT_WS_URL into the production browser build input', () => {
  expect(resolveLiveKitBuildUrl('production', {
    LIVEKIT_WS_URL: '  wss://livewalk-test.livekit.cloud  ',
  })).toBe('wss://livewalk-test.livekit.cloud');
});

test('fails a production bundle when the LiveKit URL is missing', () => {
  expect(() => resolveLiveKitBuildUrl('production', {}))
    .toThrow('Production web build requires LIVEKIT_WS_URL.');
});

test('keeps LiveKit-free local and test modes available', () => {
  expect(resolveLiveKitBuildUrl('development', {})).toBe('');
  expect(resolveLiveKitBuildUrl('test', {})).toBe('');
});
