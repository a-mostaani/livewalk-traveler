// TICKET-16: the build label on top of the app is filled in at build time, so
// it can never name a commit other than the one the build was made from.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const appConfig = require('../app.config');

test('TICKET-16: on the build service the commit comes from the service, never from local git', () => {
  let gitCalls = 0;
  const config = appConfig.createAppConfig({ extra: {} }, {
    EAS_BUILD: 'true',
    EAS_BUILD_GIT_COMMIT_HASH: 'b6f5ae70c0ffee0000000000000000000000beef',
    EAS_BUILD_PROFILE: 'preview',
    LIVELYWALK_BUILD_BRANCH: 'livekit-v1',
  }, () => { gitCalls += 1; return 'should-not-be-used'; });
  assert.equal(config.extra.buildIdentity.commit, 'b6f5ae70c0ffee0000000000000000000000beef');
  assert.equal(config.extra.buildIdentity.branch, 'livekit-v1');
  assert.equal(config.extra.buildIdentity.profile, 'preview');
  assert.equal(Number.isNaN(Date.parse(config.extra.buildIdentity.builtAt)), false);
  assert.equal(gitCalls, 0);
});

test('TICKET-16: a local run reads commit and branch from git', () => {
  const config = appConfig.createAppConfig({ extra: {} }, {}, (args) => (args.includes('--abbrev-ref') ? 'ticket-branch' : 'abcdef1234567890'));
  assert.equal(config.extra.buildIdentity.commit, 'abcdef1234567890');
  assert.equal(config.extra.buildIdentity.branch, 'ticket-branch');
  assert.equal(config.extra.buildIdentity.profile, 'local');
});

test('TICKET-16: missing values on the build service stay empty instead of being guessed', () => {
  const config = appConfig.createAppConfig({ extra: {} }, { EAS_BUILD: 'true', EAS_BUILD_PROFILE: 'preview' }, () => 'local-value');
  assert.equal(config.extra.buildIdentity.commit, '');
  assert.equal(config.extra.buildIdentity.branch, '');
});

test('TICKET-16: each build profile names the branch it is allowed to build from', () => {
  const eas = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'eas.json'), 'utf8'));
  assert.equal(eas.build.preview.env.LIVELYWALK_BUILD_BRANCH, 'livekit-v1');
  assert.equal(eas.build.development.env.LIVELYWALK_BUILD_BRANCH, 'livekit-v1');
  assert.equal(eas.build.production.env.LIVELYWALK_BUILD_BRANCH, 'main');
});
