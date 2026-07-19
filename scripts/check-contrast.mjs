import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/theme.ts', import.meta.url), 'utf8');
const colors = Object.fromEntries([...source.matchAll(/^\s+(\w+): '(#[0-9A-F]{6})',?$/gm)].map(([, key, value]) => [key, value]));

function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((value) => parseInt(value, 16) / 255);
  const linear = channels.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function ratio(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

const pairs = [
  ['primary action', 'onAction', 'action', 4.5],
  ['accent chip', 'onAction', 'accent', 4.5],
  ['danger action', 'onAction', 'danger', 4.5],
  ['primary text on surface', 'textPrimary', 'surface', 4.5],
  ['secondary text on surface', 'textSecondary', 'surface', 4.5],
  ['tertiary text on surface', 'textTertiary', 'surface', 4.5],
  ['warm accent on surface', 'accentWarm', 'surface', 4.5],
  ['success text on surface', 'success', 'surface', 4.5],
  ['success action', 'onAction', 'success', 4.5],
  ['warm accent action', 'onAction', 'accentWarm', 4.5],
  ['disabled text on disabled fill', 'disabledText', 'disabled', 4.5],
  ['on-dark muted text', 'onDarkMuted', 'textPrimary', 4.5],
  ['QA build badge label', 'qaBuildBadgeText', 'qaBuildBadgeBackground', 4.5],
];

for (const [label, foregroundName, backgroundName, minimum] of pairs) {
  const foreground = colors[foregroundName];
  const background = colors[backgroundName];
  assert.ok(foreground && background, `Missing contrast token for ${label}`);
  const actual = ratio(foreground, background);
  assert.ok(actual >= minimum, `${label} contrast ${actual.toFixed(2)} is below ${minimum}`);
  console.log(`✓ ${label}: ${actual.toFixed(2)}:1`);
}
