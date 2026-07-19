import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';
import type { LiveWalkApiSurface } from './api';
import type { TokenStore } from './tokenStorage';

const traveler = { id: 'usr_1', email: 'traveler@example.com', name: 'Ava', role: 'traveler' as const, createdAt: '2026-07-19T10:00:00Z' };

function AuthState() {
  const auth = useAuth();
  return <div>{auth.state}:{auth.user?.name || 'none'}</div>;
}

test('restores a saved browser session against auth/me', async () => {
  const tokenStore: TokenStore = { read: vi.fn(() => 'saved-token'), write: vi.fn(), clear: vi.fn() };
  const apiClient = { me: vi.fn(async () => ({ ok: true as const, user: traveler })) } as unknown as LiveWalkApiSurface;

  render(<AuthProvider apiClient={apiClient} tokenStore={tokenStore}><AuthState /></AuthProvider>);

  expect(screen.getByText('restoring:none')).toBeInTheDocument();
  expect(await screen.findByText('authenticated:Ava')).toBeInTheDocument();
  expect(apiClient.me).toHaveBeenCalledWith('saved-token');
  expect(tokenStore.clear).not.toHaveBeenCalled();
});

test('clears an invalid saved session', async () => {
  const tokenStore: TokenStore = { read: vi.fn(() => 'expired-token'), write: vi.fn(), clear: vi.fn() };
  const apiClient = { me: vi.fn(async () => { throw new Error('expired'); }) } as unknown as LiveWalkApiSurface;

  render(<AuthProvider apiClient={apiClient} tokenStore={tokenStore}><AuthState /></AuthProvider>);

  expect(await screen.findByText('anonymous:none')).toBeInTheDocument();
  expect(tokenStore.clear).toHaveBeenCalledOnce();
});
