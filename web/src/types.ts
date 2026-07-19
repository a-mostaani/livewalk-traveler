export type Traveler = {
  id: string;
  email: string;
  name: string;
  role: 'traveler';
  createdAt: string;
};

export type Place = {
  label: string;
  lat: number;
  lng: number;
};

export type PlaceDraft = {
  label: string;
  lat?: number;
  lng?: number;
};

export type RequestDraft = {
  origin: PlaceDraft;
  destination: PlaceDraft;
  scheduledStart: string;
  durationMinutes: number;
  language: string;
  interests: string[];
};

export type Quote = {
  currency: string;
  distanceKm: number;
  walkingMinutes: number;
  guideFee: number;
  platformFee: number;
  total: number;
};

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'live' | 'completed';

export type WalkRequest = {
  id: string;
  travelerName: string;
  origin: Place;
  destination: Place;
  route: string;
  scheduledStart: string;
  durationMinutes: number;
  language: string;
  interests: string[];
  estimate: Quote;
  status: RequestStatus;
  guide: { id: string; name: string; avatar?: string } | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
};
