import { Guide, WalkRequest } from '../types';

export const defaultRequest: WalkRequest = {
  origin: { label: 'Shibuya Station Hachiko Gate', lat: 35.6591, lng: 139.7005 },
  destination: { label: 'Meiji Shrine forest entrance', lat: 35.6764, lng: 139.6993 },
  scheduledStart: '2026-07-10T10:30:00+09:00',
  durationMinutes: 45,
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


export const captions = [
  'Guide: We are leaving the station plaza now. It is busy, but the side street is calmer.',
  'Translated: The small shrine ahead is where locals stop before work.',
  'Traveler note: Pause at the ramen alley for a closer look.',
];
