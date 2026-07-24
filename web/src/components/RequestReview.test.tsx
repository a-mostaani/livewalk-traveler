import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Quote, RequestDraft } from '../types';
import { RequestReview } from './RequestReview';

const draft: RequestDraft = {
  origin: { label: 'Tower Bridge, London', lat: 51.5055, lng: -0.0754 },
  destination: { label: 'Borough Market, London', lat: 51.5055, lng: -0.091 },
  scheduledStart: '2026-07-24T14:00:00.000Z',
  durationMinutes: 45,
  language: 'English',
  interests: ['Local stories', 'Architecture'],
};

const quote: Quote = {
  currency: 'USD',
  distanceKm: 1.3,
  walkingMinutes: 18,
  guideFee: 32,
  platformFee: 6,
  total: 38,
};

test('reviews exact selected endpoints, request details and the current server quote', () => {
  render(<RequestReview draft={draft} quote={quote} busy={false} onEdit={vi.fn()} onConfirm={vi.fn()} />);

  expect(screen.getByRole('heading', { name: 'Confirm the walk details' })).toBeInTheDocument();
  expect(screen.getByText('Tower Bridge, London')).toBeInTheDocument();
  expect(screen.getByText('Borough Market, London')).toBeInTheDocument();
  expect(screen.getByText('45 min')).toBeInTheDocument();
  expect(screen.getByText('Local stories, Architecture')).toBeInTheDocument();
  expect(screen.getByText('$38')).toBeInTheDocument();
  expect(screen.getByText('Selected endpoints only')).toBeInTheDocument();
  expect(screen.getByText('No street route has been calculated or drawn.')).toBeInTheDocument();
});

test('requires a deliberate confirmation and keeps edit available', async () => {
  const onEdit = vi.fn();
  const onConfirm = vi.fn();
  render(<RequestReview draft={draft} quote={quote} busy={false} onEdit={onEdit} onConfirm={onConfirm} />);

  await userEvent.click(screen.getByRole('button', { name: 'Edit details' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm and request guide' }));

  expect(onEdit).toHaveBeenCalledOnce();
  expect(onConfirm).toHaveBeenCalledOnce();
});
