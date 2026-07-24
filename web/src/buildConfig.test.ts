import { resolveMapboxBuildToken } from './buildConfig';

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
