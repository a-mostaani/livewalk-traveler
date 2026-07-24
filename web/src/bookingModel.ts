import type { BookingSnapshot, LiveSession, RequestStatus, SessionLocation, SessionStatus, WalkRequest } from './types';

const activeStatuses = new Set<RequestStatus>(['pending', 'accepted', 'live']);
const terminalRequestStatuses = new Set<RequestStatus>(['completed', 'cancelled', 'declined']);
const requestProgress: Partial<Record<RequestStatus, number>> = {
  pending: 0,
  accepted: 1,
  live: 2,
  completed: 3,
};
const terminalSessionStatuses = new Set<SessionStatus>(['ended', 'cancelled']);
const sessionProgress: Record<SessionStatus, number> = {
  ready: 0,
  live: 1,
  ended: 2,
  cancelled: 2,
};

export type LifecycleStage = 'match' | 'ready' | 'starting' | 'live' | 'complete' | 'cancelled' | 'declined';

export type LifecyclePresentation = {
  stage: LifecycleStage;
  label: string;
  detail: string;
  tone: 'cyan' | 'violet' | 'green' | 'red' | 'muted';
  railStep: number;
  live: boolean;
  terminal: boolean;
};

export type ConnectionStatus = 'connecting' | 'online' | 'reconnecting';

export function pickResumableRequest(requests: WalkRequest[]) {
  return [...requests]
    .filter((request) => activeStatuses.has(request.status))
    .sort((left, right) => timestamp(right.updatedAt) - timestamp(left.updatedAt))[0] ?? null;
}

export function presentLifecycle(request: WalkRequest, session: LiveSession | null): LifecyclePresentation {
  if (request.status === 'cancelled' || session?.status === 'cancelled') {
    return { stage: 'cancelled', label: 'Cancelled', detail: 'This request was cancelled before the walk started.', tone: 'red', railStep: 0, live: false, terminal: true };
  }
  if (request.status === 'declined') {
    return { stage: 'declined', label: 'Unavailable', detail: 'This request is no longer available.', tone: 'muted', railStep: 0, live: false, terminal: true };
  }
  if (request.status === 'completed' || session?.status === 'ended') {
    return { stage: 'complete', label: 'Completed', detail: 'This LivelyWalk has finished.', tone: 'green', railStep: 5, live: false, terminal: true };
  }
  if (request.status === 'live' && session?.status === 'live') {
    return { stage: 'live', label: 'Live now', detail: 'Your guide has started the shared walk.', tone: 'green', railStep: 4, live: true, terminal: false };
  }
  if (request.status === 'live') {
    return { stage: 'starting', label: 'Starting walk', detail: 'The booking changed to live. Confirming the shared session now.', tone: 'violet', railStep: 3, live: false, terminal: false };
  }
  if (request.status === 'accepted') {
    return {
      stage: 'ready',
      label: session?.status === 'ready' ? 'Guide confirmed · ready' : 'Guide confirmed',
      detail: session?.status === 'ready' ? 'Your guide is confirmed. Waiting for them to start the walk.' : 'Your guide is confirmed. Preparing the shared session.',
      tone: 'violet',
      railStep: 3,
      live: false,
      terminal: false,
    };
  }
  return { stage: 'match', label: 'Matching', detail: 'Your request is open in the shared guide marketplace.', tone: 'cyan', railStep: 2, live: false, terminal: false };
}

export function mergeRequest(current: WalkRequest | undefined, incoming: WalkRequest) {
  if (!current || current.id !== incoming.id) return incoming;
  if (timestamp(incoming.updatedAt) < timestamp(current.updatedAt)) return current;
  if (terminalRequestStatuses.has(current.status)) return current.status === incoming.status ? incoming : current;
  if (current.status === 'live' && incoming.status !== 'live' && incoming.status !== 'completed') return current;
  const currentProgress = requestProgress[current.status];
  const incomingProgress = requestProgress[incoming.status];
  if (currentProgress !== undefined && incomingProgress !== undefined && incomingProgress < currentProgress) return current;
  return incoming;
}

export function mergeRequestList(current: WalkRequest[], incoming: WalkRequest[]) {
  const currentById = new Map(current.map((request) => [request.id, request]));
  const merged = incoming.map((request) => mergeRequest(currentById.get(request.id), request));
  const incomingIds = new Set(incoming.map((request) => request.id));
  const retained = current.filter((request) => !incomingIds.has(request.id) && activeStatuses.has(request.status));
  return [...merged, ...retained].sort((left, right) => timestamp(right.createdAt) - timestamp(left.createdAt));
}

export function mergeSession(current: LiveSession | null | undefined, incoming: LiveSession | null) {
  if (!incoming) return current ?? null;
  if (!current || current.id !== incoming.id) return incoming;
  if (timestamp(incoming.updatedAt) < timestamp(current.updatedAt)) return current;
  if (terminalSessionStatuses.has(current.status)) return current.status === incoming.status ? incoming : current;
  if (sessionProgress[incoming.status] < sessionProgress[current.status]) return current;
  return incoming;
}

export function mergeSnapshot(current: BookingSnapshot | undefined, incoming: BookingSnapshot): BookingSnapshot {
  if (!current || current.request.id !== incoming.request.id) return incoming;
  const request = mergeRequest(current.request, incoming.request);
  const session = mergeSession(current.session, incoming.session);
  const messagesById = new Map([...current.messages, ...incoming.messages].map((message) => [message.id, message]));
  return {
    request,
    session,
    messages: [...messagesById.values()].sort((left, right) => timestamp(left.createdAt) - timestamp(right.createdAt)),
    syncedAt: timestamp(incoming.syncedAt) >= timestamp(current.syncedAt) ? incoming.syncedAt : current.syncedAt,
  };
}

export function connectionAfterFailure(hasData: boolean): ConnectionStatus {
  return hasData ? 'reconnecting' : 'connecting';
}

export function connectionAfterSuccess(): ConnectionStatus {
  return 'online';
}

export function locationFreshness(location: SessionLocation | null, now = Date.now()) {
  if (!location) return { state: 'waiting' as const, label: 'Waiting for location', ageSeconds: null };
  const ageSeconds = Math.max(0, Math.floor((now - timestamp(location.updatedAt)) / 1000));
  if (ageSeconds <= 15) return { state: 'current' as const, label: 'Live location', ageSeconds };
  if (ageSeconds <= 60) return { state: 'recent' as const, label: 'Recent location', ageSeconds };
  return { state: 'stale' as const, label: 'Location may be stale', ageSeconds };
}

export function latestGuideUpdate(snapshot: BookingSnapshot) {
  return [...snapshot.messages].reverse().find((message) => message.senderRole === 'guide' || message.senderRole === 'system') ?? null;
}

function timestamp(value?: string | null) {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
