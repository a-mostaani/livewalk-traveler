import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const config = fs.readFileSync(new URL('../src/config.ts', import.meta.url), 'utf8');
const appConfigSource = fs.readFileSync(new URL('../app.config.js', import.meta.url), 'utf8');
const search = fs.readFileSync(new URL('../src/components/PlaceSearchField.tsx', import.meta.url), 'utf8');
const liveMap = fs.readFileSync(new URL('../src/components/TravelVisuals.tsx', import.meta.url), 'utf8');
const eas = JSON.parse(fs.readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));

assert.match(appConfigSource, /process\.env\.MAPBOX_TOKEN_MOBILE/);
assert.match(appConfigSource, /requiredMobileMapboxToken/);
assert.doesNotMatch(appConfigSource, /EMBEDDED_MOBILE_MAPBOX_PUBLIC_TOKEN/);
assert.match(config, /Platform\.OS === 'web' \? MAPBOX_TOKEN_WEB : MAPBOX_TOKEN_MOBILE/);
assert.match(search, /MAPBOX_TOKEN/);
assert.match(search, /classifyMapboxPlaceSearch/);
assert.match(search, /isAbortError/);
assert.match(liveMap, /mapboxToken/);
assert.equal(eas.build.development.environment, 'development');
assert.equal(eas.build.preview.environment, 'preview');
assert.equal(eas.build.production.environment, 'production');

const appConfig = require('../app.config.js');
const originalToken = process.env.MAPBOX_TOKEN_MOBILE;

function resolveWithToken(value) {
  if (value === undefined) delete process.env.MAPBOX_TOKEN_MOBILE;
  else process.env.MAPBOX_TOKEN_MOBILE = value;
  return appConfig({ config: { extra: {} } });
}

try {
  assert.throws(() => resolveWithToken(undefined), /MAPBOX_TOKEN_MOBILE/);
  assert.throws(() => resolveWithToken('pk.your_mapbox_public_token_here'), /MAPBOX_TOKEN_MOBILE/);

  const overrideToken = 'pk.test-mapbox-public-override-token-1234567890';
  const overridden = resolveWithToken(overrideToken);
  assert.equal(overridden.extra.mapboxTokenMobileSource, 'environment');
  assert.equal(overridden.extra.mapboxTokenMobile, overrideToken);
} finally {
  if (originalToken === undefined) delete process.env.MAPBOX_TOKEN_MOBILE;
  else process.env.MAPBOX_TOKEN_MOBILE = originalToken;
}

const diagnosticSource = fs.readFileSync(new URL('../src/lib/mapboxPlaceSearch.ts', import.meta.url), 'utf8');
const diagnosticOutput = ts.transpileModule(diagnosticSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const diagnosticModule = { exports: {} };
new Function('exports', 'module', diagnosticOutput)(diagnosticModule.exports, diagnosticModule);
const { classifyMapboxPlaceSearch, mapboxPlaceSearchUrl } = diagnosticModule.exports;

assert.equal(classifyMapboxPlaceSearch(401).category, 'unauthorized');
assert.equal(classifyMapboxPlaceSearch(403).category, 'forbidden');
assert.equal(classifyMapboxPlaceSearch(429).category, 'rate-limited');
assert.equal(classifyMapboxPlaceSearch(undefined).category, 'network');
assert.equal(classifyMapboxPlaceSearch(200, 0).category, 'empty-result');
assert.equal(classifyMapboxPlaceSearch(200, 1).category, 'success');

const encodedUrl = new URL(mapboxPlaceSearchUrl('Café & Main', 'pk.test-mapbox-public-token'));
assert.equal(encodedUrl.origin, 'https://api.mapbox.com');
assert.equal(encodedUrl.pathname, '/search/geocode/v6/forward');
assert.equal(encodedUrl.searchParams.get('q'), 'Café & Main');
assert.equal(encodedUrl.searchParams.get('autocomplete'), 'true');
assert.equal(encodedUrl.searchParams.get('limit'), '5');

console.log('✓ Mapbox config requires a build-environment mobile token and place-search diagnostics cover auth, rate, network, and empty-result states.');
