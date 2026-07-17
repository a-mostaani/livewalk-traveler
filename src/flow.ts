import type { Screen } from './types';

export const stageOrder: Screen[] = ['onboarding', 'request', 'review', 'matching', 'confirmed', 'live', 'summary'];

export const stageLabels: Record<Screen, string> = {
  onboarding: 'Start',
  request: 'Request',
  review: 'Review',
  matching: 'Match',
  confirmed: 'Booked',
  live: 'Live',
  summary: 'Summary',
};

export type WalkHistoryState = 'loading' | 'empty' | 'hasHistory' | 'unavailable';

export function getWalkHistoryState({
  isLoading,
  hasLoaded,
  requestCount,
}: {
  isLoading: boolean;
  hasLoaded: boolean;
  requestCount: number;
}): WalkHistoryState {
  if (isLoading || !hasLoaded) return 'loading';
  return requestCount === 0 ? 'empty' : 'hasHistory';
}

export function getFirstWalkCta(historyState: WalkHistoryState) {
  if (historyState === 'loading') return { label: 'Checking your walks…', disabled: true };
  if (historyState === 'empty') return { label: 'Plan my first walk', disabled: false };
  if (historyState === 'hasHistory') return { label: 'Plan another walk', disabled: false };
  return { label: 'Plan a walk', disabled: false };
}

export function canOpenStage(nextScreen: Screen, guideHasStartedLive: boolean) {
  return nextScreen !== 'live' || guideHasStartedLive;
}

export function stageState(index: number, currentIndex: number): 'complete' | 'current' | 'upcoming' {
  if (index < currentIndex) return 'complete';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}
