const assert = require('node:assert/strict');
const test = require('node:test');
const appConfig = require('../app.config');

test('keeps QA identity out of the app configuration even when legacy build variables are present', () => {
  const config = appConfig.createAppConfig({ extra: { existing: 'value' } }, {
    LIVEWALK_BUILD_CHANNEL: 'qa',
    LIVEWALK_BUILD_COMMIT: 'c1483bd',
    LIVEWALK_BUILD_BRANCH: 'peter-dev',
    LIVEWALK_BUILD_PURPOSE: 'reliability QA',
  });

  assert.equal(config.extra.qaBuild, undefined);
  assert.equal(Object.hasOwn(config.extra, 'qaBuild'), false);
});

test('keeps production configuration free of QA identity metadata', () => {
  const config = appConfig.createAppConfig({ extra: {} }, {});

  assert.equal(config.extra.qaBuild, undefined);
  assert.equal(Object.hasOwn(config.extra, 'qaBuild'), false);
});
