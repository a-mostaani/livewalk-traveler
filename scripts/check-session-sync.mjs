import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const stateSource = fs.readFileSync(new URL('../src/requestState.ts', import.meta.url), 'utf8');
const stateOutput = ts.transpileModule(stateSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const module = { exports: {} };
vm.runInNewContext(stateOutput, { exports: module.exports, module });
const { isResumableRequest, selectResumableRequest, shouldApplyRemoteRequest, SingleFlightRefresh } = module.exports;

const pending = { id: 'req_pending', status: 'pending' };
const accepted = { id: 'req_accepted', status: 'accepted' };
const live = { id: 'req_live', status: 'live' };
const completed = { id: 'req_completed', status: 'completed' };
const cancelled = { id: 'req_cancelled', status: 'cancelled' };

assert.equal(isResumableRequest(pending), true);
assert.equal(isResumableRequest(accepted), true);
assert.equal(isResumableRequest(live), true);
assert.equal(isResumableRequest(completed), false);
assert.equal(isResumableRequest(cancelled), false);
assert.equal(selectResumableRequest([completed, accepted, pending]).id, accepted.id);
assert.equal(shouldApplyRemoteRequest(accepted, { ...accepted, status: 'pending' }), false);
assert.equal(shouldApplyRemoteRequest(live, { ...live, status: 'accepted' }), false);
assert.equal(shouldApplyRemoteRequest(cancelled, { ...cancelled, status: 'pending' }), false);
assert.equal(shouldApplyRemoteRequest(cancelled, { ...cancelled }), true);

const flight = new SingleFlightRefresh();
let release;
const delayed = new Promise((resolve) => { release = resolve; });
let calls = 0;
const refresh = () => flight.run(async () => {
  calls += 1;
  await delayed;
  return 'accepted';
});
const first = refresh();
const overlap = refresh();
assert.strictEqual(first, overlap);
assert.equal(calls, 0);
release();
assert.equal(await first, 'accepted');
assert.equal(calls, 1);

const session = fs.readFileSync(new URL('../src/hooks/useSession.ts', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const matching = fs.readFileSync(new URL('../src/screens/MatchingScreen.tsx', import.meta.url), 'utf8');
assert.match(session, /selectResumableRequest\(data\.requests\)/);
assert.match(session, /SingleFlightRefresh/);
assert.match(session, /shouldApplyRemoteRequest/);
assert.match(app, /remoteRequest\.status === 'pending'/);
assert.match(app, /remoteRequest\.status === 'accepted' \|\| remoteRequest\.status === 'live'/);
assert.match(matching, /onCheck\(\)\.catch/);

console.log('✓ Traveler request resume, single-flight polling, stale-response protection, and matching UI checks pass.');
