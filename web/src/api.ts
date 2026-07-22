import { API_BASE_URL } from './config';
import type { LiveKitTokenResponse, LiveSession, Quote, RequestDraft, SessionMessage, Traveler, WalkRequest } from './types';
import { hasRouteCoordinates } from './requestModel';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function friendlyError(status: number, raw?: string) {
  const message = String(raw || '').trim();
  const lower = message.toLowerCase();
  if (lower.includes('email already')) return 'That email already has an account. Sign in instead.';
  if (lower.includes('invalid email or password')) return 'Email or password is incorrect.';
  if (lower.includes('valid email')) return 'Enter a valid email address.';
  if (lower.includes('password must')) return 'Use a password with at least 6 characters.';
  if (status === 401) return 'Your session expired. Sign in again.';
  if (lower.includes('only pending or accepted')) return 'This walk has already started and can no longer be cancelled.';
  if (status >= 500) return 'LivelyWalk is having trouble right now. Please try again.';
  return message || `Request failed (${status}).`;
}

function apiDraft(draft: RequestDraft) {
  if (!hasRouteCoordinates(draft)) throw new Error('Select both places from search results.');
  return {
    origin: draft.origin,
    destination: draft.destination,
    scheduledStart: draft.scheduledStart,
    durationMinutes: draft.durationMinutes,
    language: draft.language,
    interests: draft.interests,
  };
}

export class LiveWalkApi {
  constructor(
    private readonly baseUrl = API_BASE_URL,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  private async request<T>(path: string, init: RequestInit = {}, token = ''): Promise<T> {
    let response: Response;
    try {
      const fetcher = this.fetcher;
      response = await fetcher(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(init.headers || {}),
        },
      });
    } catch {
      throw new ApiError('Cannot reach LivelyWalk. Check your connection and try again.', 0);
    }

    const data = await response.json().catch(() => ({})) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) throw new ApiError(friendlyError(response.status, data.error), response.status);
    return data as T;
  }

  health() {
    return this.request<{ ok: true; backend: string; time: string }>('/api/health');
  }

  register(payload: { name: string; email: string; password: string }) {
    return this.request<{ ok: true; user: Traveler; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, role: 'traveler' }),
    });
  }

  login(payload: { email: string; password: string }) {
    return this.request<{ ok: true; user: Traveler; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  me(token: string) {
    return this.request<{ ok: true; user: Traveler }>('/api/auth/me', {}, token);
  }

  logout(token: string) {
    return this.request<{ ok: true; loggedOut: true }>('/api/auth/logout', { method: 'POST' }, token);
  }

  estimate(token: string, draft: RequestDraft) {
    return this.request<{ ok: true; estimate: Quote }>('/api/requests/estimate', {
      method: 'POST',
      body: JSON.stringify(apiDraft(draft)),
    }, token);
  }

  createRequest(token: string, draft: RequestDraft) {
    return this.request<{ ok: true; request: WalkRequest }>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(apiDraft(draft)),
    }, token);
  }

  listRequests(token: string) {
    return this.request<{ ok: true; requests: WalkRequest[] }>('/api/requests', {}, token);
  }

  getRequest(token: string, id: string) {
    return this.request<{ ok: true; request: WalkRequest }>(`/api/requests/${encodeURIComponent(id)}`, {}, token);
  }

  cancelRequest(token: string, id: string) {
    return this.request<{ ok: true; request: WalkRequest }>(`/api/requests/${encodeURIComponent(id)}/cancel`, { method: 'POST' }, token);
  }

  getSessionStatus(token: string, sessionId: string) {
    return this.request<{ ok: true; session: LiveSession; request?: WalkRequest; messages: SessionMessage[] }>(`/api/sessions/${encodeURIComponent(sessionId)}/status`, {}, token);
  }

  sendSessionMessage(token: string, sessionId: string, text: string) {
    return this.request<{ ok: true; message: SessionMessage }>(`/api/sessions/${encodeURIComponent(sessionId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }, token);
  }

  endSession(token: string, sessionId: string) {
    return this.request<{ ok: true; session: LiveSession; request?: WalkRequest; messages: SessionMessage[] }>(`/api/sessions/${encodeURIComponent(sessionId)}/end`, { method: 'POST' }, token);
  }

  fetchLiveKitToken(token: string, sessionId: string) {
    return this.request<LiveKitTokenResponse>(`/api/sessions/${encodeURIComponent(sessionId)}/livekit-token`, { method: 'POST' }, token);
  }
}

export const liveWalkApi = new LiveWalkApi();
export type LiveWalkApiSurface = Pick<LiveWalkApi, 'health' | 'register' | 'login' | 'me' | 'logout' | 'estimate' | 'createRequest' | 'listRequests' | 'getRequest' | 'cancelRequest' | 'getSessionStatus' | 'sendSessionMessage' | 'endSession' | 'fetchLiveKitToken'>;
