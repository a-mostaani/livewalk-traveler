import { describe, expect, it, vi } from 'vitest';
import { TravelerSubscribeController, getConnectionProps, type LiveKitTokenResult } from '../src/session/travelerSubscribe';

const tokenResult: LiveKitTokenResult = {
  token: 'jwt-token',
  room: 'session-1',
  identity: 'usr_traveler',
  canPublish: false,
  expiresIn: 600,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('TravelerSubscribeController', () => {
  it('fetches a token and reaches ready, joining the room without publishing (subscribe-only)', async () => {
    const fetchToken = vi.fn().mockResolvedValue(tokenResult);
    const controller = new TravelerSubscribeController({ fetchToken });

    const connecting = controller.start('session-1');
    expect(controller.getState()).toEqual({ status: 'connecting', sessionId: 'session-1' });
    expect(getConnectionProps(controller.getState())).toEqual({ connect: false, token: undefined, video: false, audio: false });

    const ready = await connecting;
    expect(fetchToken).toHaveBeenCalledWith('session-1');
    expect(fetchToken).toHaveBeenCalledTimes(1);
    expect(ready).toEqual({ status: 'ready', sessionId: 'session-1', token: 'jwt-token', room: 'session-1', canPublish: false });
    expect(getConnectionProps(ready)).toEqual({ connect: true, token: 'jwt-token', video: false, audio: false });
  });

  it('would publish if the server ever granted publish permission (defensive - Traveler is expected to always get canPublish: false)', async () => {
    const fetchToken = vi.fn().mockResolvedValue({ ...tokenResult, canPublish: true });
    const controller = new TravelerSubscribeController({ fetchToken });

    const ready = await controller.start('session-1');
    expect(getConnectionProps(ready)).toEqual({ connect: true, token: 'jwt-token', video: true, audio: true });
  });

  it('dedupes overlapping start() calls for the same session (single-flight)', async () => {
    const gate = deferred<LiveKitTokenResult>();
    const fetchToken = vi.fn().mockReturnValue(gate.promise);
    const controller = new TravelerSubscribeController({ fetchToken });

    const first = controller.start('session-1');
    const second = controller.start('session-1');
    expect(fetchToken).toHaveBeenCalledTimes(1);

    gate.resolve(tokenResult);
    await expect(first).resolves.toMatchObject({ status: 'ready' });
    await expect(second).resolves.toMatchObject({ status: 'ready' });
  });

  it('discards a late-arriving token if stop() was called before the fetch resolved', async () => {
    const gate = deferred<LiveKitTokenResult>();
    const fetchToken = vi.fn().mockReturnValue(gate.promise);
    const controller = new TravelerSubscribeController({ fetchToken });

    const starting = controller.start('session-1');
    controller.stop();
    expect(controller.getState()).toEqual({ status: 'idle' });

    gate.resolve(tokenResult);
    await starting;
    expect(controller.getState()).toEqual({ status: 'idle' });
  });

  it('discards a late-arriving token if a newer session was started before the fetch resolved', async () => {
    const firstGate = deferred<LiveKitTokenResult>();
    const fetchToken = vi.fn()
      .mockReturnValueOnce(firstGate.promise)
      .mockResolvedValueOnce({ ...tokenResult, room: 'session-2' });
    const controller = new TravelerSubscribeController({ fetchToken });

    const stale = controller.start('session-1');
    const fresh = await controller.start('session-2');

    expect(fresh).toEqual({ status: 'ready', sessionId: 'session-2', token: 'jwt-token', room: 'session-2', canPublish: false });

    firstGate.resolve({ ...tokenResult, room: 'session-1' });
    await stale;
    expect(controller.getState()).toEqual(fresh);
  });

  it('surfaces a token-fetch failure as an error state with no connection props', async () => {
    const fetchToken = vi.fn().mockRejectedValue(new Error('Cannot reach LiveWalk right now.'));
    const controller = new TravelerSubscribeController({ fetchToken });

    const errored = await controller.start('session-1');
    expect(errored).toEqual({ status: 'error', sessionId: 'session-1', message: 'Cannot reach LiveWalk right now.' });
    expect(getConnectionProps(errored)).toEqual({ connect: false, token: undefined, video: false, audio: false });
  });

  it('stop() on an already-idle controller is a no-op', () => {
    const fetchToken = vi.fn();
    const controller = new TravelerSubscribeController({ fetchToken });

    expect(controller.stop()).toEqual({ status: 'idle' });
    expect(fetchToken).not.toHaveBeenCalled();
  });

  it('cleanly restarts after a stop() releases the previous session', async () => {
    const fetchToken = vi.fn().mockResolvedValue(tokenResult);
    const controller = new TravelerSubscribeController({ fetchToken });

    await controller.start('session-1');
    controller.stop();
    const restarted = await controller.start('session-1');

    expect(fetchToken).toHaveBeenCalledTimes(2);
    expect(restarted).toMatchObject({ status: 'ready', sessionId: 'session-1' });
  });
});
