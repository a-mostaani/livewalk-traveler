import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomEvent, Track } from 'livekit-client';
import type { LiveSession } from '../types';
import { GuideMediaPanel, type GuideMediaRoom } from './GuideMediaPanel';

class FakeRoom implements GuideMediaRoom {
  listeners = new Map<RoomEvent, Set<(...args: any[]) => void>>();
  connect = vi.fn(async () => undefined);
  disconnect = vi.fn(async () => undefined);
  startAudio = vi.fn(async () => undefined);
  canPlaybackAudio = false;

  on(event: RoomEvent, listener: (...args: any[]) => void) {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return this;
  }

  off(event: RoomEvent, listener: (...args: any[]) => void) {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: RoomEvent, ...args: any[]) {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }
}

const liveSession: LiveSession = {
  id: 'sess_1',
  requestId: 'req_1',
  status: 'live',
  startedAt: '2026-07-25T08:00:00Z',
  location: null,
  createdAt: '2026-07-25T07:55:00Z',
  updatedAt: '2026-07-25T08:00:00Z',
};

function setup() {
  const room = new FakeRoom();
  const apiClient = {
    getLiveKitToken: vi.fn(async () => ({
      ok: true as const,
      token: 'livekit-jwt',
      room: 'sess_1',
      identity: 'traveler_1',
      canPublish: false as const,
      expiresIn: 600,
    })),
  };
  const view = render(
    <GuideMediaPanel
      session={liveSession}
      authToken="traveler-session-token"
      apiClient={apiClient}
      roomFactory={() => room}
      liveKitWsUrl="wss://livewalk-test.livekit.cloud"
    />,
  );
  return { room, apiClient, view };
}

test('joins with the existing session token endpoint as an auto-subscribing viewer', async () => {
  const { room, apiClient } = setup();

  await waitFor(() => expect(room.connect).toHaveBeenCalledWith(
    'wss://livewalk-test.livekit.cloud',
    'livekit-jwt',
    { autoSubscribe: true },
  ));
  expect(apiClient.getLiveKitToken).toHaveBeenCalledWith('traveler-session-token', 'sess_1');
  expect(screen.getByRole('status')).toHaveTextContent('Connected. Waiting for the Guide camera.');
});

test('attaches Guide video/audio, requires a browser gesture for audio and cleans up', async () => {
  const { room, view } = setup();
  await waitFor(() => expect(room.connect).toHaveBeenCalledOnce());

  const videoTrack = {
    kind: Track.Kind.Video,
    sid: 'video_1',
    attach: vi.fn(),
    detach: vi.fn(),
  };
  const audioTrack = {
    kind: Track.Kind.Audio,
    sid: 'audio_1',
    attach: vi.fn(),
    detach: vi.fn(),
  };

  act(() => {
    room.emit(RoomEvent.TrackSubscribed, videoTrack);
    room.emit(RoomEvent.TrackSubscribed, audioTrack);
  });

  await waitFor(() => expect(videoTrack.attach).toHaveBeenCalledWith(screen.getByLabelText('Guide live video')));
  expect(audioTrack.attach).toHaveBeenCalledWith(screen.getByLabelText('Guide live audio'));

  const audioElement = screen.getByLabelText('Guide live audio') as HTMLAudioElement;
  Object.defineProperty(audioElement, 'play', { value: vi.fn(async () => undefined), configurable: true });
  await userEvent.click(screen.getByRole('button', { name: 'Enable Guide audio' }));

  expect(room.startAudio).toHaveBeenCalledOnce();
  expect(audioElement.play).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Guide audio on' })).toBeDisabled();

  view.unmount();
  expect(videoTrack.detach).toHaveBeenCalled();
  expect(audioTrack.detach).toHaveBeenCalled();
  expect(room.disconnect).toHaveBeenCalledOnce();
});

test('surfaces reconnect, recovery, terminal and retryable error states', async () => {
  const { room, view } = setup();
  await waitFor(() => expect(room.connect).toHaveBeenCalledOnce());

  act(() => room.emit(RoomEvent.Reconnecting));
  expect(screen.getByRole('status')).toHaveTextContent('Reconnecting to Guide media…');

  act(() => room.emit(RoomEvent.Reconnected));
  expect(screen.getByRole('status')).toHaveTextContent('Connected. Waiting for the Guide camera.');

  act(() => room.emit(RoomEvent.Disconnected));
  expect(screen.getByRole('alert')).toHaveTextContent('Guide media disconnected.');
  expect(screen.getByRole('button', { name: 'Rejoin Guide media' })).toBeInTheDocument();

  view.rerender(
    <GuideMediaPanel
      session={{ ...liveSession, status: 'ended', endedAt: '2026-07-25T08:20:00Z' }}
      authToken="traveler-session-token"
      roomFactory={() => room}
      liveKitWsUrl="wss://livewalk-test.livekit.cloud"
    />,
  );
  expect(screen.getByRole('status')).toHaveTextContent('Live Guide media has ended.');
});
