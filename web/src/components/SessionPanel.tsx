import { useState } from 'react';
import type { BookingSnapshot } from '../types';

export type SessionActionState = {
  sessionId: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  message: string;
};

const quickInstructions = [
  'Please slow down.',
  'Please pause somewhere safe.',
  'Please describe what you see.',
];

export function SessionPanel({
  snapshot,
  messageState,
  onSendMessage,
}: {
  snapshot: BookingSnapshot;
  messageState: SessionActionState;
  onSendMessage: (sessionId: string, text: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState('');
  const session = snapshot.session;
  const live = snapshot.request.status === 'live' && session?.status === 'live';
  const currentState = messageState.sessionId === session?.id
    ? messageState
    : { sessionId: '', status: 'idle' as const, message: '' };

  const send = async (text: string) => {
    const normalized = text.trim();
    if (!session || !live || !normalized || currentState.status === 'pending') return;
    const sent = await onSendMessage(session.id, normalized);
    if (sent) setDraft('');
  };

  if (!session) return null;

  return (
    <section className="session-panel" aria-labelledby="session-messages-heading">
      <div className="session-panel-heading">
        <div>
          <span className="overline">SHARED SESSION</span>
          <h4 id="session-messages-heading">Messages with your guide</h4>
        </div>
        <small>{live ? 'Live and authenticated' : session.status === 'ended' ? 'Session completed' : 'Available when the guide starts'}</small>
      </div>

      <div className="message-feed" aria-label="Session messages">
        {snapshot.messages.length ? snapshot.messages.map((message) => (
          <article className={`session-message role-${message.senderRole}`} key={message.id}>
            <div><strong>{message.senderName}</strong><time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time></div>
            <p>{message.text}</p>
          </article>
        )) : (
          <p className="empty-messages">{live ? 'No shared messages yet.' : 'Messages will appear here once the shared session is active.'}</p>
        )}
      </div>

      {live ? (
        <div className="session-composer">
          <div className="quick-instructions" aria-label="Quick instructions">
            {quickInstructions.map((instruction) => (
              <button
                type="button"
                key={instruction}
                disabled={currentState.status === 'pending'}
                onClick={() => void send(instruction)}
              >
                {instruction}
              </button>
            ))}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void send(draft); }}>
            <label htmlFor={`session-message-${session.id}`}>Message your guide</label>
            <div>
              <input
                id={`session-message-${session.id}`}
                maxLength={1000}
                placeholder="Type a short instruction…"
                value={draft}
                disabled={currentState.status === 'pending'}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button className="button button-secondary" type="submit" disabled={!draft.trim() || currentState.status === 'pending'}>
                {currentState.status === 'pending' ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
          <div className={`session-action-state ${currentState.status}`} aria-live="polite">
            {currentState.status === 'pending' ? <><span className="spinner" />Sending to the shared session…</> : null}
            {currentState.status === 'success' ? <>✓ {currentState.message}</> : null}
            {currentState.status === 'error' ? <>! {currentState.message}</> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Time unavailable';
}
