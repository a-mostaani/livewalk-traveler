import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { WalkRequest } from '../types';
import { RequestCard } from './RequestCard';

const baseRequest: WalkRequest = {
  id: 'req_1234567890',
  travelerName: 'Ava',
  origin: { label: 'Tower Bridge', lat: 51.5055, lng: -0.0754 },
  destination: { label: 'Borough Market', lat: 51.5055, lng: -0.091 },
  route: 'Tower Bridge → Borough Market',
  scheduledStart: '2026-07-22T14:00:00.000Z',
  durationMinutes: 45,
  language: 'English',
  interests: [],
  estimate: { currency: 'USD', distanceKm: 1.3, walkingMinutes: 18, guideFee: 32, platformFee: 6, total: 38 },
  status: 'accepted',
  guide: { id: 'guide_1', name: 'Maya' },
  sessionId: 'sess_1',
  createdAt: '2026-07-19T10:00:00Z',
  updatedAt: '2026-07-19T10:05:00Z',
};

test('renders confirmed booking state and permits cancellation before live start', async () => {
  const onCancel = vi.fn();
  render(<RequestCard request={baseRequest} cancelling={false} onCancel={onCancel} />);

  expect(screen.getByText('Booked · confirmed')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Cancel before start' }));
  expect(onCancel).toHaveBeenCalledWith(baseRequest);
});

test('renders cancelled state without a cancellation control', () => {
  render(<RequestCard request={{ ...baseRequest, status: 'cancelled' }} cancelling={false} onCancel={vi.fn()} />);

  expect(screen.getByText('Cancelled')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cancel before start' })).not.toBeInTheDocument();
});
