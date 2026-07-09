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

export type WalkRequest = {
  origin: RequestPoint;
  destination: RequestPoint;
  scheduledStart: string;
  durationMinutes: number;
  language: string;
  interests: string[];
};

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
  status: 'pending' | 'accepted' | 'declined' | 'live';
  guide: MarketplaceGuide | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
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
  status: 'ready' | 'live';
  startedAt?: string | null;
  location?: { label?: string; progress?: number } | null;
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
