import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const config = fs.readFileSync(new URL('../src/config.ts', import.meta.url), 'utf8');
const appConfigSource = fs.readFileSync(new URL('../app.config.js', import.meta.url), 'utf8');
const search = fs.readFileSync(new URL('../src/components/PlaceSearchField.tsx', import.meta.url), 'utf8');
const liveMap = fs.readFileSync(new URL('../src/components/TravelVisuals.tsx', import.meta.url), 'utf8');
const eas = JSON.parse(fs.readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));

assert.match(appConfigSource, /EMBEDDED_MOBILE_MAPBOX_PUBLIC_TOKEN/);
assert.match(appConfigSource, /process\.env\.MAPBOX_TOKEN_MOBILE/);
assert.doesNotMatch(appConfigSource, /requiredBuildEnv/);
assert.match(config, /Platform\.OS === 'web' \? MAPBOX_TOKEN_WEB : MAPBOX_TOKEN_MOBILE/);
assert.match(search, /MAPBOX_TOKEN/);
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
  const fallback = resolveWithToken(undefined);
  assert.equal(fallback.extra.mapboxTokenMobileSource, 'embedded fallback');
  assert.equal(fallback.extra.mapboxTokenMobileDiagnostic, '');
  assert.ok(fallback.extra.mapboxTokenMobile.startsWith('pk.'));
  assert.ok(fallback.extra.mapboxTokenMobile.length >= 20);

  const overrideToken = 'pk.test-mapbox-public-override-token-1234567890';
  const overridden = resolveWithToken(overrideToken);
  assert.equal(overridden.extra.mapboxTokenMobileSource, 'environment');
  assert.equal(overridden.extra.mapboxTokenMobile, overrideToken);
  assert.equal(overridden.extra.mapboxTokenMobileDiagnostic, '');

  const invalid = resolveWithToken('invalid-token');
  assert.equal(invalid.extra.mapboxTokenMobileSource, 'environment');
  assert.equal(invalid.extra.mapboxTokenMobile, '');
  assert.match(invalid.extra.mapboxTokenMobileDiagnostic, /missing or invalid/);
} finally {
  if (originalToken === undefined) delete process.env.MAPBOX_TOKEN_MOBILE;
  else process.env.MAPBOX_TOKEN_MOBILE = originalToken;
}

console.log('✓ Mapbox mobile config supports environment overrides, an embedded public fallback, and nonfatal unavailable diagnostics.');
