import { canSubmitQuotedRequest, requestFingerprint, retainSelectedCoordinates, updatePlaceQuery } from './requestModel';
import type { RequestDraft } from './types';

const draft: RequestDraft = {
  origin: { label: 'Tower Bridge, London', lat: 51.5055, lng: -0.0754 },
  destination: { label: 'Borough Market, London', lat: 51.5055, lng: -0.091 },
  scheduledStart: '2026-07-22T14:00:00.000Z',
  durationMinutes: 45,
  language: 'English',
  interests: ['Local stories'],
};

test('requires a current server quote before submission', () => {
  expect(canSubmitQuotedRequest(draft, '')).toBe(false);
  const quoted = requestFingerprint(draft);
  expect(canSubmitQuotedRequest(draft, quoted)).toBe(true);
  expect(canSubmitQuotedRequest({ ...draft, durationMinutes: 60 }, quoted)).toBe(false);
  expect(canSubmitQuotedRequest(draft, quoted, true)).toBe(false);
});

test('retains selected Mapbox coordinates and clears them when the label is edited', () => {
  const selected = retainSelectedCoordinates({ label: 'Tower Bridge, London', lat: 51.5055, lng: -0.0754 });
  expect(selected).toEqual({ label: 'Tower Bridge, London', lat: 51.5055, lng: -0.0754 });
  expect(updatePlaceQuery('Tower Bridge')).toEqual({ label: 'Tower Bridge' });
});
