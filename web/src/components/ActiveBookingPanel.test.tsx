import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BookingSnapshot, LiveSession, SessionMessage, WalkRequest } from '../types';
import { ActiveBookingPanel, type CancellationState } from './ActiveBookingPanel';

const now = Date.parse('2026-07-24T10:01:00Z');

const request = (status: WalkRequest['status']): WalkRequest => ({
  id: 'req_1',
  travelerName: 'Ava',
  origin: { label: 'Tower Bridge', lat: 51.5055, lng: -0.0754 },
  destination: { label: 'Borough Market', lat: 51.5055, lng: -0.091 },
  route: 'Tower Bridge → Borough Market',
  scheduledStart: '2026-07-24T14:00:00Z',
  durationMinutes: 45,
  language: 'English',
  interests: [],
  estimate: { currency: 'USD', distanceKm: 1.3, walkingMinutes: 18, guideFee: 32, platformFee: 6, total: 38 },
  status,
  guide: status === 'pending' ? null : { id: 'guide_1', name: 'Maya' },
  sessionId: status === 'pending' ? null : 'sess_1',
  createdAt: '2026-07-24T09:00:00Z',
  updatedAt: '2026-07-24T10:00:00Z',
});

const session = (
  status: LiveSession['status'],
  location: LiveSession['location'] = null,
): LiveSession => ({
  id: 'sess_1',
  requestId: 'req_1',
  status,
  startedAt: status === 'ready' ? null : '2026-07-24T10:00:00Z',
  endedAt: status === 'ended' ? '2026-07-24T10:01:00Z' : null,
  location,
  createdAt: '2026-07-24T09:30:00Z',
  updatedAt: '2026-07-24T10:00:00Z',
});

const guideMessage: SessionMessage = {
  id: 'msg_1',
  sessionId: 'sess_1',
  senderRole: 'guide',
  senderName: 'Maya',
  text: 'I am crossing the bridge now.',
  createdAt: '2026-07-24T10:00:40Z',
};

const cancellation = (
  status: CancellationState['status'] = 'idle',
  message = '',
): CancellationState => ({
  requestId: status === 'idle' ? '' : 'req_1',
  status,
  message,
});

const snapshot = (
  requestStatus: WalkRequest['status'],
  liveSession: LiveSession | null = null,
  messages: SessionMessage[] = [],
): BookingSnapshot => ({
  request: request(requestStatus),
  session: liveSession,
  messages,
  syncedAt: '2026-07-24T10:01:00Z',
});

function panel(
  booking: BookingSnapshot,
  options: {
    connection?: 'connecting' | 'online' | 'reconnecting';
    cancellationState?: CancellationState;
    refreshing?: boolean;
    onRefresh?: () => void;
    onCancel?: (walkRequest: WalkRequest) => void;
  } = {},
) {
  return (
    <ActiveBookingPanel
      snapshot={booking}
      connection={options.connection ?? 'online'}
      lastSuccessfulAt={new Date('2026-07-24T10:00:30Z')}
      refreshing={options.refreshing ?? false}
      cancellation={options.cancellationState ?? cancellation()}
      now={now}
      onRefresh={options.onRefresh ?? vi.fn()}
      onCancel={options.onCancel ?? vi.fn()}
    />
  );
}

test('shows the visible lifecycle changing from matching through ready, live and complete', () => {
  const view = render(panel(snapshot('pending')));

  expect(screen.getByText('Matching')).toBeInTheDocument();
  expect(screen.getByText('Matching in progress')).toBeInTheDocument();
  expect(screen.getByText('Your request is open in the shared guide marketplace.')).toBeInTheDocument();

  view.rerender(panel(snapshot('accepted', session('ready'))));
  expect(screen.getByText('Guide confirmed · ready')).toBeInTheDocument();
  expect(screen.getByText('Your guide is confirmed. Waiting for them to start the walk.')).toBeInTheDocument();
  expect(screen.queryByText('Live now')).not.toBeInTheDocument();

  view.rerender(panel(snapshot('live', session('live'))));
  expect(screen.getByText('Live now')).toBeInTheDocument();
  expect(screen.getByText('Your guide has started the shared walk.')).toBeInTheDocument();

  view.rerender(panel(snapshot('completed', session('ended'))));
  expect(screen.getByText('Completed')).toBeInTheDocument();
  expect(screen.getByText('This LivelyWalk has finished.')).toBeInTheDocument();
  expect(screen.queryByRole('list', { name: 'Active booking progress' })).not.toBeInTheDocument();
});

test('renders the latest guide update and current GPS progress', () => {
  render(panel(snapshot('live', session('live', {
    label: 'Southwark riverside',
    lat: 51.50621,
    lng: -0.08234,
    progress: 52,
    updatedAt: '2026-07-24T10:00:50Z',
  }), [guideMessage])));

  expect(screen.getByRole('heading', { name: 'Maya' })).toBeInTheDocument();
  expect(screen.getByText('I am crossing the bridge now.')).toBeInTheDocument();
  expect(screen.getByText('Live location')).toBeInTheDocument();
  expect(screen.getByText('51.50621, -0.08234')).toBeInTheDocument();
  expect(screen.getByLabelText('Route progress 52 percent').firstElementChild).toHaveStyle({ width: '52%' });
  expect(screen.getByText('52% progress · updated 10s ago')).toBeInTheDocument();
});

test('keeps confirmed booking data visible while reconnecting and supports a manual check', async () => {
  const onRefresh = vi.fn();
  render(panel(snapshot('accepted', session('ready')), {
    connection: 'reconnecting',
    onRefresh,
  }));

  expect(screen.getByRole('alert')).toHaveTextContent('Reconnecting to guide updates');
  expect(screen.getByRole('alert')).toHaveTextContent('Showing the last confirmed booking data while the connection recovers.');
  expect(screen.getByText('Guide confirmed · ready')).toBeInTheDocument();
  expect(screen.getByText('Maya')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Check now' }));
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

test('labels stale and missing GPS without inventing location data', () => {
  const view = render(panel(snapshot('live', session('live', {
    label: 'Last confirmed position',
    lat: 51.50621,
    lng: -0.08234,
    progress: 52,
    updatedAt: '2026-07-24T09:58:00Z',
  }))));

  expect(screen.getByText('Location may be stale')).toBeInTheDocument();
  expect(screen.getByText('52% progress · updated 3m ago')).toBeInTheDocument();

  view.rerender(panel(snapshot('accepted', session('ready'))));
  expect(screen.getAllByText('Waiting for location')).toHaveLength(2);
  expect(screen.getByText('The guide’s GPS position will appear after the shared session starts sending location updates.')).toBeInTheDocument();
});

test('disables cancellation while pending and preserves its visible state', () => {
  render(panel(snapshot('accepted', session('ready')), {
    cancellationState: cancellation('pending', 'Cancelling request…'),
  }));

  expect(screen.getByText('Cancelling request…')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancellation pending' })).toBeDisabled();
});

test('shows cancellation success without another action and exposes error retry', async () => {
  const onCancel = vi.fn();
  const booking = snapshot('accepted', session('ready'));
  const view = render(panel(booking, {
    cancellationState: cancellation('success', 'Cancellation confirmed. This request is closed.'),
    onCancel,
  }));

  expect(screen.getByText('Cancellation confirmed. This request is closed.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();

  view.rerender(panel(booking, {
    cancellationState: cancellation('error', 'Cancellation failed. Try again.'),
    onCancel,
  }));
  expect(screen.getByText('Cancellation failed. Try again.')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Retry cancellation' }));
  expect(onCancel).toHaveBeenCalledWith(booking.request);
});
