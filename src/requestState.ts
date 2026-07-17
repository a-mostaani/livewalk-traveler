import type { MarketplaceRequest } from './types';

export function isPreLiveRequest(request?: MarketplaceRequest): boolean {
  return Boolean(request?.id && (request.status === 'pending' || request.status === 'accepted'));
}
