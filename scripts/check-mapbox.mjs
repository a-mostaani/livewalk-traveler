import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const config = fs.readFileSync(new URL('../src/config.ts', import.meta.url), 'utf8');
const appConfigSource = fs.readFileSync(new URL('../app.config.js', import.meta.url), 'utf8');
const search = fs.readFileSync(new URL('../src/components/PlaceSearchField.tsx', import.meta.url), 'utf8');
const liveMap = fs.readFileSync(new URL('../src/components/TravelVisuals.tsx', import.meta.url), 'utf8');
const eas = JSON.parse(fs.readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));

assert.match(appConfigSource, /MAPBOX_TOKEN_WEB/);
assert.match(appConfigSource, /requiredBuildEnv\('MAPBOX_TOKEN_MOBILE'\)/);
assert.match(config, /Platform\.OS === 'web' \? MAPBOX_TOKEN_WEB : MAPBOX_TOKEN_MOBILE/);
assert.match(search, /MAPBOX_TOKEN/);
assert.match(liveMap, /mapboxToken/);
assert.equal(eas.build.development.environment, 'development');
assert.equal(eas.build.preview.environment, 'preview');
assert.equal(eas.build.production.environment, 'production');

const mapboxTokenMobile = process.env.MAPBOX_TOKEN_MOBILE?.trim();
assert.ok(mapboxTokenMobile, 'MAPBOX_TOKEN_MOBILE must be present in the build environment.');

const appConfig = require('../app.config.js');
const resolved = appConfig({ config: { extra: {} } });
assert.equal(resolved.extra.mapboxTokenMobile, mapboxTokenMobile);
assert.ok(resolved.extra.mapboxTokenMobile.length > 0);

const missingToken = spawnSync(process.execPath, ['-e', "require('./app.config.js')({ config: { extra: {} } })"], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, MAPBOX_TOKEN_MOBILE: '' },
  encoding: 'utf8',
});
assert.notEqual(missingToken.status, 0);
assert.match(`${missingToken.stdout}${missingToken.stderr}`, /MAPBOX_TOKEN_MOBILE/);

console.log('✓ Mapbox mobile token is present in resolved Expo config; missing build tokens fail before APK packaging.');
