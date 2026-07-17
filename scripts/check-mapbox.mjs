import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = fs.readFileSync(new URL('../src/config.ts', import.meta.url), 'utf8');
const appConfig = fs.readFileSync(new URL('../app.config.js', import.meta.url), 'utf8');
const search = fs.readFileSync(new URL('../src/components/PlaceSearchField.tsx', import.meta.url), 'utf8');
const liveMap = fs.readFileSync(new URL('../src/components/TravelVisuals.tsx', import.meta.url), 'utf8');

assert.match(appConfig, /MAPBOX_TOKEN_WEB/);
assert.match(appConfig, /MAPBOX_TOKEN_MOBILE/);
assert.match(config, /Platform\.OS === 'web' \? MAPBOX_TOKEN_WEB : MAPBOX_TOKEN_MOBILE/);
assert.match(search, /MAPBOX_TOKEN/);
assert.match(liveMap, /mapboxToken/);
console.log('✓ Mapbox web/mobile token selection and map/search consumers are wired.');
