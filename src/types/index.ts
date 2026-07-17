export type Screen =
  | 'onboarding'
  | 'request'
  | 'review'
  | 'matching'
  | 'confirmed'
  | 'live'
  | 'summary';

export type RequestPoint = {
  label: string;
  lat: number;
  lng: number;
};

export type RequestDraftPoint = {
  label: string;
  lat?: number;
  lng?: number;
};

export type WalkRequest = {
  origin: RequestDraftPoint;
  destination: RequestDraftPoint;
  scheduledStart: string;
  durationMinutes: number;
  language: string;
  interests: string[];
};

export function isRequestPoint(value: RequestDraftPoint): value is RequestPoint {
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

export function hasRouteCoordinates(request: WalkRequest): boolean {
  return isRequestPoint(request.origin) && isRequestPoint(request.destination);
}

export type Guide = {
  id: string;
  name: string;
  city: string;
  rating: number;
  walks: number;
  languages: string[];
  specialty: string;
  eta: string;
  priceMultiplier: number;
  avatar: string;
};

export type Estimate = {
  currency: string;
  distanceKm: number;
  walkingMinutes: number;
  platformFee: number;
  guideFee: number;
  total: number;
};

export type MarketplaceGuide = {
  id: string;
  name: string;
  avatar?: string;
};

export type SessionLocation = {
  lat?: number;
  lng?: number;
  accuracy?: number | null;
  timestamp?: string | null;
  label?: string;
  progress?: number | null;
};

export type MarketplaceRequest = {
  id: string;
  travelerName: string;
  origin: RequestPoint;
  destination: RequestPoint;
  route: string;
  scheduledStart: string;
  durationMinutes: number;
  language: string;
  interests: string[];
  estimate: Estimate;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'live' | 'completed';
  guide: MarketplaceGuide | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
  location?: SessionLocation | null;
};

export type SessionMessage = {
  id: string;
  sessionId: string;
  senderRole: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export type LiveSession = {
  id: string;
  requestId: string;
  status: 'ready' | 'live' | 'ended';
  startedAt?: string | null;
  endedAt?: string | null;
  location?: SessionLocation | null;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'traveler' | 'guide';
  createdAt: string;
};

export type AuthPayload = {
  name?: string;
  email: string;
  password: string;
};
