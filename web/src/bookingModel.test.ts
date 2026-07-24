import {
  connectionAfterFailure,
  connectionAfterSuccess,
  locationFreshness,
  mergeRequest,
  mergeSession,
  pickResumableRequest,
  presentLifecycle,
} from './bookingModel';
import type { LiveSession, WalkRequest } from './types';

const request = (status: WalkRequest['status'], updatedAt = '2026-07-24T10:00:00Z'): WalkRequest => ({
  id: 'req_1',
  travelerName: 'Ava',
  origin: { label: 'Tower Bridge', lat: 51.5055, lng: -0.0754 },
  destination: { label: 'Borough Market', lat: 51.5055, lng: -0.091 },
  route: 'Tower Bridge → Borough Market',
  scheduledStart: '2026-07-24T14:00:00Z',
  durationMinutes: 45,
  language: 'English',
  interests: [],
  estimate: { currency: 'USD', distanceKm: 1.3, walkingMinutes: 18, guideFee: 32, platformFee: 6, total: 38 },
  status,
  guide: status === 'pending' ? null : { id: 'guide_1', name: 'Maya' },
  sessionId: status === 'pending' ? null : 'sess_1',
  createdAt: '2026-07-24T09:00:00Z',
  updatedAt,
});

const session = (status: LiveSession['status'], updatedAt = '2026-07-24T10:00:00Z'): LiveSession => ({
  id: 'sess_1',
  requestId: 'req_1',
  status,
  startedAt: status === 'ready' ? null : '2026-07-24T10:00:00Z',
  endedAt: status === 'ended' ? updatedAt : null,
  location: null,
  createdAt: '2026-07-24T09:30:00Z',
  updatedAt,
});

test('resumes the newest active booking and ignores newer terminal history', () => {
  const pending = request('pending', '2026-07-24T09:30:00Z');
  const live = { ...request('live', '2026-07-24T10:30:00Z'), id: 'req_live' };
  const completed = { ...request('completed', '2026-07-24T11:00:00Z'), id: 'req_done' };

  expect(pickResumableRequest([pending, completed, live])?.id).toBe('req_live');
});

test('requires both request and session live states before presenting a live walk', () => {
  expect(presentLifecycle(request('accepted'), session('ready'))).toMatchObject({ stage: 'ready', live: false, label: 'Guide confirmed · ready' });
  expect(presentLifecycle(request('live'), session('ready'))).toMatchObject({ stage: 'starting', live: false });
  expect(presentLifecycle(request('live'), session('live'))).toMatchObject({ stage: 'live', live: true });
  expect(presentLifecycle(request('completed'), session('ended'))).toMatchObject({ stage: 'complete', terminal: true });
});

test('does not let stale request or session responses undo cancellation and live progress', () => {
  const cancelled = request('cancelled', '2026-07-24T10:02:00Z');
  expect(mergeRequest(cancelled, request('accepted', '2026-07-24T10:01:00Z'))).toBe(cancelled);

  const liveRequest = request('live', '2026-07-24T10:03:00Z');
  expect(mergeRequest(liveRequest, request('accepted', '2026-07-24T10:04:00Z'))).toBe(liveRequest);

  const liveSession = session('live', '2026-07-24T10:03:00Z');
  expect(mergeSession(liveSession, session('ready', '2026-07-24T10:04:00Z'))).toBe(liveSession);
});

test('labels current, recent, stale and missing GPS updates honestly', () => {
  const now = Date.parse('2026-07-24T10:01:00Z');
  const location = { label: 'Guide location', lat: 51.5, lng: -0.08, progress: 52, updatedAt: '2026-07-24T10:00:50Z' };
  expect(locationFreshness(location, now).state).toBe('current');
  expect(locationFreshness({ ...location, updatedAt: '2026-07-24T10:00:20Z' }, now).state).toBe('recent');
  expect(locationFreshness({ ...location, updatedAt: '2026-07-24T09:58:00Z' }, now).state).toBe('stale');
  expect(locationFreshness(null, now).state).toBe('waiting');
});

test('keeps existing data visible while reconnecting and returns online after recovery', () => {
  expect(connectionAfterFailure(true)).toBe('reconnecting');
  expect(connectionAfterFailure(false)).toBe('connecting');
  expect(connectionAfterSuccess()).toBe('online');
});
