export type LiveKitTokenResult = {
  token: string;
  room: string;
  identity: string;
  canPublish: boolean;
  expiresIn: number;
};

export type LiveSessionSubscribeState =
  | { status: 'idle' }
  | { status: 'connecting'; sessionId: string }
  | { status: 'ready'; sessionId: string; token: string; room: string; canPublish: boolean }
  | { status: 'error'; sessionId: string; message: string };

export type LiveSessionSubscribeDeps = {
  fetchToken: (sessionId: string) => Promise<LiveKitTokenResult>;
};

export type LiveSessionConnectionProps = {
  connect: boolean;
  token: string | undefined;
  video: boolean;
  audio: boolean;
};

const IDLE_STATE: LiveSessionSubscribeState = { status: 'idle' };

// Ported from livewalk-traveler mobile's src/session/travelerSubscribe.ts (LW-10d),
// itself ported from livewalk-guide's guideBroadcast.ts (LW-10c) - same token
// fetch -> connect -> publish -> cleanup lifecycle, same epoch-guard against a
// late-arriving fetchToken response overwriting state after stop() or a newer
// start() has already superseded it. Web Traveler is subscribe-only same as
// mobile, so canPublish is expected to come back false from the server.
export class LiveSessionSubscribeController {
  private epoch = 0;
  private state: LiveSessionSubscribeState = IDLE_STATE;
  private inFlight?: { sessionId: string; promise: Promise<LiveSessionSubscribeState> };

  constructor(private deps: LiveSessionSubscribeDeps) {}

  getState(): LiveSessionSubscribeState {
    return this.state;
  }

  start(sessionId: string): Promise<LiveSessionSubscribeState> {
    if (this.state.status === 'ready' && this.state.sessionId === sessionId) {
      return Promise.resolve(this.state);
    }
    if (this.inFlight && this.inFlight.sessionId === sessionId) {
      return this.inFlight.promise;
    }
    this.epoch += 1;
    const epoch = this.epoch;
    this.state = { status: 'connecting', sessionId };
    const promise: Promise<LiveSessionSubscribeState> = this.deps.fetchToken(sessionId).then(
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

  stop(): LiveSessionSubscribeState {
    this.epoch += 1;
    this.inFlight = undefined;
    this.state = IDLE_STATE;
    return this.state;
  }
}

export function getConnectionProps(state: LiveSessionSubscribeState): LiveSessionConnectionProps {
  if (state.status !== 'ready') return { connect: false, token: undefined, video: false, audio: false };
  return { connect: true, token: state.token, video: state.canPublish, audio: state.canPublish };
}
