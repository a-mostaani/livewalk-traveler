import { Guide, WalkRequest, Estimate } from '../types';

export const defaultRequest: WalkRequest = {
  start: 'Shibuya Station, Tokyo',
  destination: 'Meiji Shrine forest entrance',
  dateTime: 'Tomorrow, 10:30 AM',
  duration: '45 min',
  language: 'English',
  interests: ['Hidden corners', 'Food stops', 'Local stories'],
};

export const interestOptions = [
  'Architecture',
  'Food stops',
  'History',
  'Shopping',
  'Hidden corners',
  'Nature',
  'Photo spots',
  'Local stories',
];

export const languageOptions = ['English', 'Spanish', 'French', 'Japanese', 'Italian', 'German'];

export const guides: Guide[] = [
  {
    id: 'yuki',
    name: 'Yuki Tanaka',
    city: 'Tokyo',
    rating: 4.96,
    walks: 184,
    languages: ['English', 'Japanese'],
    specialty: 'Calm city walks, food detours, temple etiquette',
    eta: 'Available for your slot',
    priceMultiplier: 1,
    avatar: 'YT',
  },
  {
    id: 'mika',
    name: 'Mika Sato',
    city: 'Tokyo',
    rating: 4.91,
    walks: 92,
    languages: ['English', 'Japanese', 'Spanish'],
    specialty: 'Street culture, shopping arcades, photo stops',
    eta: 'Responds in ~3 min',
    priceMultiplier: 1.12,
    avatar: 'MS',
  },
];

export function estimateRequest(request: WalkRequest): Estimate {
  const baseDistance = Math.max(1.2, Math.min(5.8, (request.start.length + request.destination.length) / 18));
  const minutes = parseInt(request.duration, 10) || 45;
  const guideFee = Math.round(minutes * 0.72);
  const platformFee = Math.round(guideFee * 0.18);

  return {
    distanceKm: Number(baseDistance.toFixed(1)),
    walkingMinutes: Math.min(minutes, Math.round(baseDistance * 18)),
    guideFee,
    platformFee,
    total: guideFee + platformFee,
  };
}

export const captions = [
  'Guide: We are leaving the station plaza now. It is busy, but the side street is calmer.',
  'Translated: The small shrine ahead is where locals stop before work.',
  'Traveler note: Pause at the ramen alley for a closer look.',
];
