import { ApiError, LiveWalkApi } from './api';
import type { RequestDraft } from './types';

const draft: RequestDraft = {
  origin: { label: 'Tower Bridge', lat: 51.5055, lng: -0.0754 },
  destination: { label: 'Borough Market', lat: 51.5055, lng: -0.091 },
  scheduledStart: '2026-07-22T14:00:00.000Z',
  durationMinutes: 45,
  language: 'English',
  interests: ['Local stories'],
};

test('API adapter sends bearer auth and real route coordinates to the estimate endpoint', async () => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify({
    ok: true,
    estimate: { currency: 'USD', distanceKm: 1.3, walkingMinutes: 18, guideFee: 32, platformFee: 6, total: 38 },
  }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
  const client = new LiveWalkApi('https://api.example.test', fetcher);

  await client.estimate('session-token', draft);

  expect(fetcher).toHaveBeenCalledOnce();
  const [url, init] = vi.mocked(fetcher).mock.calls[0];
  expect(url).toBe('https://api.example.test/api/requests/estimate');
  expect(new Headers(init?.headers).get('authorization')).toBe('Bearer session-token');
  expect(JSON.parse(String(init?.body))).toMatchObject({ origin: draft.origin, destination: draft.destination, durationMinutes: 45 });
});

test('API adapter calls the browser fetch function without rebinding its receiver', async () => {
  let receiver: unknown;
  const fetcher = function (this: unknown) {
    receiver = this;
    return Promise.resolve(new Response(JSON.stringify({ ok: true, backend: 'test', time: new Date().toISOString() }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
  } as typeof fetch;
  const client = new LiveWalkApi('https://api.example.test', fetcher);

  await client.health();

  expect(receiver).toBeUndefined();
});

test('API adapter surfaces unauthorized responses as typed session errors', async () => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: false, error: 'Login required' }), { status: 401, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
  const client = new LiveWalkApi('https://api.example.test', fetcher);

  await expect(client.listRequests('expired')).rejects.toEqual(expect.objectContaining({ name: 'ApiError', status: 401, message: 'Your session expired. Sign in again.' }));
});

test('API adapter reads the authenticated session status feed without media actions', async () => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify({
    ok: true,
    request: { id: 'req_1' },
    session: { id: 'sess_1', status: 'live' },
    messages: [],
  }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
  const client = new LiveWalkApi('https://api.example.test', fetcher);

  await client.getSessionStatus('session-token', 'sess_1');

  const [url, init] = vi.mocked(fetcher).mock.calls[0];
  expect(url).toBe('https://api.example.test/api/sessions/sess_1/status');
  expect(new Headers(init?.headers).get('authorization')).toBe('Bearer session-token');
  expect(init?.method).toBeUndefined();
});
