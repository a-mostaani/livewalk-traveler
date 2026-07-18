const assert = require('node:assert/strict');
const test = require('node:test');
const appConfig = require('../app.config');

test('renders Traveler QA metadata from the QA build config', () => {
  const config = appConfig.createAppConfig({ extra: { existing: 'value' } }, {
    LIVEWALK_BUILD_CHANNEL: 'qa',
    LIVEWALK_BUILD_COMMIT: '8412b17',
    LIVEWALK_BUILD_BRANCH: 'peter-dev',
    LIVEWALK_BUILD_PURPOSE: 'reliability QA',
  });

  assert.deepEqual(config.extra.qaBuild, {
    commit: '8412b17',
    branch: 'peter-dev',
    purpose: 'reliability QA',
    label: 'QA BUILD · 8412b17 · peter-dev · reliability QA',
  });
});

test('returns no Traveler QA badge metadata without QA build config', () => {
  const config = appConfig.createAppConfig({ extra: {} }, {});

  assert.equal(config.extra.qaBuild, undefined);
  assert.equal(Object.hasOwn(config.extra, 'qaBuild'), false);
});
