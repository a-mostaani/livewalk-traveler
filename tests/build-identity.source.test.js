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
  vm.runInNewContext(compiled, { exports: module.exports, module });
  return { source, identity: module.exports };
}

test('renders the committed Traveler QA identity without environment or Expo config injection', () => {
  const { source, identity } = loadBuildIdentity();

  assert.doesNotMatch(source, /process\.env|expo-constants|Constants\.expoConfig/);
  assert.deepEqual(JSON.parse(JSON.stringify(identity.QA_BUILD_METADATA)), {
    commit: 'c1483bd',
    branch: 'peter-dev',
    purpose: 'reliability QA',
    label: 'QA BUILD · c1483bd · peter-dev · reliability QA',
  });
  assert.deepEqual(JSON.parse(JSON.stringify(identity.renderQaBuildIdentity(identity.ACTIVE_BUILD_METADATA))), {
    testID: 'qa-build-badge',
    labelTestID: 'qa-build-badge-label',
    accessibilityLabel: 'QA BUILD · c1483bd · peter-dev · reliability QA',
    label: 'QA BUILD · c1483bd · peter-dev · reliability QA',
  });
});

test('renders no build identity for the production/main metadata path', () => {
  const { identity } = loadBuildIdentity();

  assert.equal(identity.PRODUCTION_BUILD_METADATA, null);
  assert.equal(identity.renderQaBuildIdentity(identity.PRODUCTION_BUILD_METADATA), null);
});

test('places the QA identity in the shared shell header for auth and authenticated screens', () => {
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
  const authSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'screens', 'AuthScreen.tsx'), 'utf8');
  const badgeIndex = appSource.indexOf('<QaBuildBadge />');
  const scrollIndex = appSource.indexOf('          <ScrollView');

  assert.ok(badgeIndex > -1);
  assert.ok(badgeIndex < scrollIndex);
  assert.doesNotMatch(appSource, /\{user \? <QaBuildBadge \/> : null\}/);
  assert.doesNotMatch(authSource, /QaBuildBadge/);
});
