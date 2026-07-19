import type { Place, PlaceDraft, RequestDraft, RequestStatus } from './types';

export function isSelectedPlace(value: PlaceDraft): value is Place {
  return Boolean(
    value.label.trim()
    && Number.isFinite(value.lat)
    && Number.isFinite(value.lng)
    && (value.lat as number) >= -90
    && (value.lat as number) <= 90
    && (value.lng as number) >= -180
    && (value.lng as number) <= 180,
  );
}

export function hasRouteCoordinates(draft: RequestDraft) {
  return isSelectedPlace(draft.origin) && isSelectedPlace(draft.destination);
}

export function updatePlaceQuery(label: string): PlaceDraft {
  return { label };
}

export function retainSelectedCoordinates(place: Place): PlaceDraft {
  return { label: place.label, lat: place.lat, lng: place.lng };
}

export function requestFingerprint(draft: RequestDraft) {
  if (!hasRouteCoordinates(draft)) return '';
  return JSON.stringify({
    origin: [draft.origin.label, draft.origin.lat, draft.origin.lng],
    destination: [draft.destination.label, draft.destination.lat, draft.destination.lng],
    scheduledStart: draft.scheduledStart,
    durationMinutes: draft.durationMinutes,
    language: draft.language,
    interests: [...draft.interests].sort(),
  });
}

export function canSubmitQuotedRequest(draft: RequestDraft, quoteFingerprint: string, busy = false) {
  return !busy && Boolean(quoteFingerprint) && quoteFingerprint === requestFingerprint(draft);
}

export function localDateTimeToIso(value: string) {
  const parsed = new Date(value);
  if (!value || !Number.isFinite(parsed.getTime())) throw new Error('Choose a valid date and time.');
  return parsed.toISOString();
}

export const cancellableStatuses: RequestStatus[] = ['pending', 'accepted'];

export type StatusPresentation = {
  label: string;
  tone: 'cyan' | 'violet' | 'green' | 'red' | 'muted';
  detail: string;
  step: number;
  cancelled: boolean;
};

export function presentStatus(status: RequestStatus): StatusPresentation {
  switch (status) {
    case 'pending': return { label: 'Requested', tone: 'cyan', detail: 'Sent to the shared guide marketplace.', step: 1, cancelled: false };
    case 'accepted': return { label: 'Booked · confirmed', tone: 'violet', detail: 'Your guide accepted. The session is ready to start.', step: 3, cancelled: false };
    case 'live': return { label: 'Live now', tone: 'green', detail: 'Your guide has started the shared walk.', step: 4, cancelled: false };
    case 'completed': return { label: 'Completed', tone: 'green', detail: 'This LivelyWalk has finished.', step: 5, cancelled: false };
    case 'cancelled': return { label: 'Cancelled', tone: 'red', detail: 'This request was cancelled before the walk started.', step: 0, cancelled: true };
    case 'declined': return { label: 'Unavailable', tone: 'muted', detail: 'This request is no longer available.', step: 0, cancelled: true };
  }
}
