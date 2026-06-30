export type Screen =
  | 'onboarding'
  | 'request'
  | 'review'
  | 'matching'
  | 'confirmed'
  | 'live'
  | 'summary';

export type WalkRequest = {
  start: string;
  destination: string;
  dateTime: string;
  duration: string;
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
  distanceKm: number;
  walkingMinutes: number;
  platformFee: number;
  guideFee: number;
  total: number;
};
