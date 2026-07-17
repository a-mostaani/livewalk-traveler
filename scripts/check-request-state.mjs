import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const file = new URL('../src/flow.ts', import.meta.url);
const source = fs.readFileSync(file, 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const module = { exports: {} };
vm.runInNewContext(output, { exports: module.exports, module });
const { getFirstWalkCta, getWalkHistoryState, canOpenStage, stageState } = module.exports;

assert.equal(getWalkHistoryState({ isLoading: true, hasLoaded: false, requestCount: 0 }), 'loading');
assert.equal(getWalkHistoryState({ isLoading: false, hasLoaded: true, requestCount: 0 }), 'empty');
assert.equal(getWalkHistoryState({ isLoading: false, hasLoaded: true, requestCount: 1 }), 'hasHistory');
assert.equal(getFirstWalkCta('empty').label, 'Plan my first walk');
assert.equal(getFirstWalkCta('empty').disabled, false);
assert.equal(getFirstWalkCta('hasHistory').label, 'Plan another walk');
assert.equal(getFirstWalkCta('hasHistory').disabled, false);
assert.equal(getFirstWalkCta('unavailable').label, 'Plan a walk');
assert.equal(getFirstWalkCta('unavailable').disabled, false);
assert.equal(canOpenStage('live', false), false);
assert.equal(canOpenStage('live', true), true);
assert.equal(canOpenStage('request', false), true);
assert.equal(stageState(0, 2), 'complete');
assert.equal(stageState(2, 2), 'current');
assert.equal(stageState(4, 2), 'upcoming');
console.log('✓ Request history CTA and stage state rules pass.');
