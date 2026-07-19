export const API_BASE_URL = String(import.meta.env.VITE_LIVEWALK_API_BASE_URL || 'https://rendezvous-livewalk-api.webpeter.com').replace(/\/+$/, '');
export const MAPBOX_TOKEN = String(import.meta.env.VITE_MAPBOX_TOKEN || '').trim();
