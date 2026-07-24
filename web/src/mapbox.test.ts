import { normalizePlaceLabel, placeFromFeature } from './mapbox';

test('removes repeated administrative segments while retaining meaningful place and country context', () => {
  expect(normalizePlaceLabel('Luxembourg, Luxembourg, Luxembourg')).toBe('Luxembourg');
  expect(normalizePlaceLabel('Luxembourg City, Luxembourg, Luxembourg')).toBe('Luxembourg City, Luxembourg');
  expect(normalizePlaceLabel('  Place du Théâtre,  Luxembourg , Luxembourg  ')).toBe('Place du Théâtre, Luxembourg');
  expect(normalizePlaceLabel('Paris, Île-de-France, France')).toBe('Paris, Île-de-France, France');
});

test('normalizes provider labels without changing result coordinates', () => {
  expect(placeFromFeature({
    geometry: { coordinates: [6.1319, 49.6116] },
    properties: { full_address: 'Luxembourg, Luxembourg, Luxembourg' },
  })).toEqual({ label: 'Luxembourg', lat: 49.6116, lng: 6.1319 });
});
