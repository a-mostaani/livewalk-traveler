export type LiveKitTokenResult = {
  token: string;
  room: string;
  identity: string;
  canPublish: boolean;
  expiresIn: number;
};

export type TravelerSubscribeState =
  | { status: 'idle' }
  | { status: 'connecting'; sessionId: string }
  | { status: 'ready'; sessionId: string; token: string; room: string; canPublish: boolean }
  | { status: 'error'; sessionId: string; message: string };

export type TravelerSubscribeDeps = {
  fetchToken: (sessionId: string) => Promise<LiveKitTokenResult>;
};

export type TravelerSubscribeConnectionProps = {
  connect: boolean;
  token: string | undefined;
  video: boolean;
  audio: boolean;
};

const IDLE_STATE: TravelerSubscribeState = { status: 'idle' };

// Ported from livewalk-guide/src/session/guideBroadcast.ts (LW-10c) - same
// token fetch -> connect -> publish -> cleanup lifecycle, same epoch-guard
// against a late-arriving fetchToken response overwriting state after
// stop() or a newer start() has already superseded it. Traveler is
// subscribe-only, so canPublish is expected to come back false from the
// server and getConnectionProps() will never set video/audio - the room is
// still joined (connect: true) so the Guide's remote track can be received.
export class TravelerSubscribeController {
  private epoch = 0;
  private state: TravelerSubscribeState = IDLE_STATE;
  private inFlight?: { sessionId: string; promise: Promise<TravelerSubscribeState> };

  constructor(private deps: TravelerSubscribeDeps) {}

  getState(): TravelerSubscribeState {
    return this.state;
  }

  start(sessionId: string): Promise<TravelerSubscribeState> {
    if (this.state.status === 'ready' && this.state.sessionId === sessionId) {
      return Promise.resolve(this.state);
    }
    if (this.inFlight && this.inFlight.sessionId === sessionId) {
      return this.inFlight.promise;
    }
    this.epoch += 1;
    const epoch = this.epoch;
    this.state = { status: 'connecting', sessionId };
    const promise: Promise<TravelerSubscribeState> = this.deps.fetchToken(sessionId).then(
      (result) => {
        if (epoch !== this.epoch) return this.state;
        this.state = { status: 'ready', sessionId, token: result.token, room: result.room, canPublish: result.canPublish };
        return this.state;
      },
      (error: unknown) => {
        if (epoch !== this.epoch) return this.state;
        this.state = { status: 'error', sessionId, message: error instanceof Error ? error.message : 'Could not join the live session.' };
        return this.state;
      },
    ).finally(() => {
      if (this.inFlight?.promise === promise) this.inFlight = undefined;
    });
    this.inFlight = { sessionId, promise };
    return promise;
  }

  stop(): TravelerSubscribeState {
    this.epoch += 1;
    this.inFlight = undefined;
    this.state = IDLE_STATE;
    return this.state;
  }
}

export function getConnectionProps(state: TravelerSubscribeState): TravelerSubscribeConnectionProps {
  if (state.status !== 'ready') return { connect: false, token: undefined, video: false, audio: false };
  return { connect: true, token: state.token, video: state.canPublish, audio: state.canPublish };
}
