import type { MarketplaceRequest } from './types';

export function isPreLiveRequest(request?: MarketplaceRequest): boolean {
  return Boolean(request?.id && (request.status === 'pending' || request.status === 'accepted'));
}

export function isResumableRequest(request?: MarketplaceRequest): boolean {
  return Boolean(request?.id && (request.status === 'pending' || request.status === 'accepted' || request.status === 'live'));
}

export function selectResumableRequest(requests: MarketplaceRequest[]): MarketplaceRequest | undefined {
  return requests.find(isResumableRequest);
}

export function shouldApplyRemoteRequest(current: MarketplaceRequest | undefined, incoming: MarketplaceRequest): boolean {
  if (!current || current.id !== incoming.id) return false;
  if (current.status === 'cancelled' || current.status === 'completed') return incoming.status === current.status;
  if (current.status === 'live') return incoming.status !== 'pending' && incoming.status !== 'accepted';
  if (current.status === 'accepted') return incoming.status !== 'pending';
  return true;
}

export class SingleFlightRefresh {
  private inFlight?: Promise<unknown>;

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.inFlight) return this.inFlight as Promise<T>;
    const task = Promise.resolve().then(work);
    this.inFlight = task;
    const clear = () => {
      if (this.inFlight === task) this.inFlight = undefined;
    };
    void task.then(clear, clear);
    return task;
  }
}
