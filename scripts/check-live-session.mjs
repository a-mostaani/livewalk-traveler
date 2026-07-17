import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const session = fs.readFileSync(new URL('../src/hooks/useSession.ts', import.meta.url), 'utf8');
const live = fs.readFileSync(new URL('../src/screens/LiveWalkScreen.tsx', import.meta.url), 'utf8');

assert.match(app, /canOpenStage\(nextScreen, guideHasStartedLive\)/);
assert.match(app, /screen === 'confirmed' && !guideHasStartedLive/);
assert.match(session, /getSessionStatus\(request\.sessionId\)/);
assert.match(session, /endSession\(request\.sessionId\)/);
assert.match(live, /remoteRequest\?\.sessionId && remoteRequest\?\.status === 'live'/);
console.log('✓ Live-session gate, refresh, controls, and end-session flow remain wired.');
