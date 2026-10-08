// TICKET-16: the build label is derived from build-time values, shown loudly
// when they are missing, and hidden only in production builds.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

function loadBuildIdentity() {
  const sourcePath = path.join(__dirname, '..', 'src', 'buildIdentity.ts');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { exports: module.exports, module, Date });
  return { source, identity: module.exports };
}

const full = { commit: 'b6f5ae70c0ffee0000000000000000000000beef', branch: 'livekit-v1', profile: 'preview', builtAt: '2026-10-08T20:45:10.000Z' };
const plain = (value) => JSON.parse(JSON.stringify(value));

test('TICKET-16: shows commit, branch and build time for a test build', () => {
  const { identity } = loadBuildIdentity();
  const label = identity.buildIdentityLabel(full);
  assert.equal(label, 'TEST BUILD · b6f5ae7 · livekit-v1 · 2026-10-08 20:45 UTC');
  assert.deepEqual(plain(identity.renderQaBuildIdentity(label)), {
    testID: 'qa-build-badge',
    labelTestID: 'qa-build-badge-label',
    accessibilityLabel: label,
    label,
  });
});

test('TICKET-16: production builds show no label', () => {
  const { identity } = loadBuildIdentity();
  assert.equal(identity.buildIdentityLabel({ ...full, profile: 'production' }), null);
  assert.equal(identity.renderQaBuildIdentity(null), null);
});

test('TICKET-16: missing values are shown as UNKNOWN, never hidden', () => {
  const { identity } = loadBuildIdentity();
  assert.equal(identity.buildIdentityLabel(undefined), 'TEST BUILD · UNKNOWN COMMIT · UNKNOWN BRANCH · UNKNOWN DATE');
  assert.equal(identity.buildIdentityLabel({ profile: 'preview', commit: '', branch: '', builtAt: 'nonsense' }), 'TEST BUILD · UNKNOWN COMMIT · UNKNOWN BRANCH · UNKNOWN DATE');
  assert.match(identity.buildIdentityLabel({ ...full, commit: 'not-a-hash' }), /UNKNOWN COMMIT/);
});

test('TICKET-16: no commit or branch is typed into the source by hand', () => {
  const { source } = loadBuildIdentity();
  assert.doesNotMatch(source, /['"`][0-9a-f]{7}['"`]/);
  assert.doesNotMatch(source, /peter-dev|livekit-v1/);
  assert.doesNotMatch(source, /process\.env|expo-constants|Constants\.expoConfig/);
});

test('TICKET-16: the label sits in the shared header, on signed-out and signed-in screens alike', () => {
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
  const authSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'screens', 'AuthScreen.tsx'), 'utf8');
  const badgeIndex = appSource.indexOf('<QaBuildBadge />');
  const scrollIndex = appSource.indexOf('          <ScrollView');
  assert.ok(badgeIndex > -1);
  assert.ok(badgeIndex < scrollIndex);
  assert.doesNotMatch(appSource, /\{user \? <QaBuildBadge \/> : null\}/);
  assert.doesNotMatch(authSource, /QaBuildBadge/);
});

test('TICKET-16: a test build is refused unless it is the pushed, clean tip of the right branch', async () => {
  const { branchForProfile, preflightProblems } = await import('../scripts/build-test-rules.mjs');
  assert.equal(branchForProfile('preview'), 'livekit-v1');
  assert.equal(branchForProfile('production'), 'main');
  const ok = { profile: 'preview', branch: 'livekit-v1', dirty: false, head: 'abc', remoteHead: 'abc' };
  assert.deepEqual(preflightProblems(ok), []);
  assert.equal(preflightProblems({ ...ok, branch: 'peter-dev' }).length, 1);
  assert.equal(preflightProblems({ ...ok, dirty: true }).length, 1);
  assert.equal(preflightProblems({ ...ok, remoteHead: 'older' }).length, 1);
  assert.equal(preflightProblems({ ...ok, remoteHead: '' }).length, 1);
});
