import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const stateSource = fs.readFileSync(new URL('../src/requestState.ts', import.meta.url), 'utf8');
const stateOutput = ts.transpileModule(stateSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const module = { exports: {} };
vm.runInNewContext(stateOutput, { exports: module.exports, module });
const { isPreLiveRequest } = module.exports;

assert.equal(isPreLiveRequest({ id: 'req_pending', status: 'pending' }), true);
assert.equal(isPreLiveRequest({ id: 'req_accepted', status: 'accepted' }), true);
assert.equal(isPreLiveRequest({ id: 'req_live', status: 'live' }), false);
assert.equal(isPreLiveRequest({ id: 'req_cancelled', status: 'cancelled' }), false);

const api = fs.readFileSync(new URL('../src/api.ts', import.meta.url), 'utf8');
const session = fs.readFileSync(new URL('../src/hooks/useSession.ts', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const matching = fs.readFileSync(new URL('../src/screens/MatchingScreen.tsx', import.meta.url), 'utf8');
const confirmed = fs.readFileSync(new URL('../src/screens/ConfirmedScreen.tsx', import.meta.url), 'utf8');

assert.match(api, /\/api\/requests\/\$\{id\}\/cancel/);
assert.match(api, /method: 'POST'/);
assert.match(session, /await cancelWalkRequest\(requestId\)/);
assert.match(session, /data\.request\.status !== 'cancelled'/);
assert.match(app, /Cancel this request\?/);
assert.match(matching, /Cancel request/);
assert.match(confirmed, /Cancel request/);
console.log('✓ Traveler pre-live cancellation eligibility, API call, confirmation, and screens remain wired.');
