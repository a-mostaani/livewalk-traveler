import { latestGuideUpdate, locationFreshness, presentLifecycle, type ConnectionStatus } from '../bookingModel';
import { cancellableStatuses } from '../requestModel';
import type { BookingSnapshot, WalkRequest } from '../types';
import { CompletionSummary } from './CompletionSummary';
import { GuideMediaPanel } from './GuideMediaPanel';
import { SessionPanel, type SessionActionState } from './SessionPanel';

const rail = ['Plan', 'Match', 'Ready', 'Live', 'Complete'];

export type CancellationState = {
  requestId: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  message: string;
};

export function ActiveBookingPanel({
  snapshot,
  connection,
  lastSuccessfulAt,
  refreshing,
  cancellation,
  messageState,
  endState,
  now = Date.now(),
  onRefresh,
  onCancel,
  onSendMessage,
  onEnd,
  authToken,
}: {
  snapshot: BookingSnapshot;
  connection: ConnectionStatus;
  lastSuccessfulAt?: Date;
  refreshing: boolean;
  cancellation: CancellationState;
  messageState: SessionActionState;
  endState: SessionActionState;
  now?: number;
  onRefresh: () => void;
  onCancel: (request: WalkRequest) => void;
  onSendMessage: (sessionId: string, text: string) => Promise<boolean>;
  onEnd: (sessionId: string) => void;
  authToken: string;
}) {
  const lifecycle = presentLifecycle(snapshot.request, snapshot.session);
  const freshness = locationFreshness(snapshot.session?.location ?? null, now);
  const guideUpdate = latestGuideUpdate(snapshot);
  const canCancel = cancellableStatuses.includes(snapshot.request.status);
  const start = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(snapshot.request.scheduledStart));
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: snapshot.request.estimate.currency, maximumFractionDigits: 0 }).format(snapshot.request.estimate.total);
  const location = snapshot.session?.location;
  const cancellationForBooking = cancellation.requestId === snapshot.request.id ? cancellation : { requestId: '', status: 'idle' as const, message: '' };
  const endForSession = endState.sessionId === snapshot.session?.id ? endState : { sessionId: '', status: 'idle' as const, message: '' };

  return (
    <article className={`active-booking status-${lifecycle.tone}`} aria-labelledby="active-booking-heading">
      <div className="active-booking-head">
        <div>
          <span className="overline">ACTIVE BOOKING</span>
          <h3 id="active-booking-heading">{snapshot.request.origin.label} <span>→</span> {snapshot.request.destination.label}</h3>
        </div>
        <span className={`status-badge ${lifecycle.tone}`}>{lifecycle.live ? <span className="live-dot" /> : null}{lifecycle.label}</span>
      </div>

      <div className={`connection-banner ${connection}`} role={connection === 'reconnecting' ? 'alert' : 'status'}>
        <span className="connection-indicator" />
        <div>
          <strong>{connection === 'online' ? 'Guide updates connected' : connection === 'reconnecting' ? 'Reconnecting to guide updates' : 'Connecting to guide updates'}</strong>
          <small>
            {connection === 'reconnecting'
              ? 'Showing the last confirmed booking data while the connection recovers.'
              : lastSuccessfulAt
                ? `Last guide update check ${formatRelative(lastSuccessfulAt, now)}.`
                : 'Waiting for the first confirmed update.'}
          </small>
        </div>
        <button type="button" onClick={onRefresh} disabled={refreshing}>{refreshing ? 'Checking…' : 'Check now'}</button>
      </div>

      {!lifecycle.terminal ? (
        <ol className="booking-rail" aria-label="Active booking progress">
          {rail.map((label, index) => {
            const step = index + 1;
            const state = step < lifecycle.railStep ? 'done' : step === lifecycle.railStep ? 'current' : '';
            return <li key={label} className={state}><span>{step < lifecycle.railStep ? '✓' : step}</span><small>{label}</small></li>;
          })}
        </ol>
      ) : null}

      <p className="lifecycle-detail">{lifecycle.detail}</p>

      <div className="booking-facts">
        <div><span>Guide</span><strong>{snapshot.request.guide?.name || 'Matching in progress'}</strong></div>
        <div><span>Scheduled</span><strong>{start}</strong></div>
        <div><span>Server quote</span><strong>{money}</strong></div>
        <div><span>Duration</span><strong>{snapshot.request.durationMinutes} min</strong></div>
      </div>

      <div className="live-update-grid">
        <section className="update-card" aria-labelledby="guide-update-heading">
          <div className="update-card-heading">
            <span>GUIDE UPDATE</span>
            <small>{guideUpdate ? formatRelative(new Date(guideUpdate.createdAt), now) : 'Waiting'}</small>
          </div>
          <h4 id="guide-update-heading">{guideUpdate?.senderName || 'No guide update yet'}</h4>
          <p>{guideUpdate?.text || 'Guide and system updates will appear here when the shared session begins.'}</p>
        </section>

        <section className={`update-card gps-card freshness-${freshness.state}`} aria-labelledby="gps-heading">
          <div className="update-card-heading">
            <span id="gps-heading">GUIDE GPS</span>
            <small className="freshness-badge">{freshness.label}</small>
          </div>
          {location ? (
            <>
              <h4>{location.label || 'Guide location'}</h4>
              <p>{formatCoordinate(location.lat)}, {formatCoordinate(location.lng)}</p>
              <div className="progress-track" aria-label={`Route progress ${Math.round(location.progress)} percent`}><span style={{ width: `${clamp(location.progress)}%` }} /></div>
              <small>{Math.round(location.progress)}% progress · updated {formatAge(freshness.ageSeconds)}</small>
            </>
          ) : (
            <>
              <h4>Waiting for location</h4>
              <p>The guide’s GPS position will appear after the shared session starts sending location updates.</p>
            </>
          )}
        </section>
      </div>

      {snapshot.session ? <GuideMediaPanel session={snapshot.session} authToken={authToken} /> : null}
      <CompletionSummary snapshot={snapshot} />
      <SessionPanel snapshot={snapshot} messageState={messageState} onSendMessage={onSendMessage} />

      <div className="active-booking-actions">
        <div className={`cancellation-state ${cancellationForBooking.status}`} aria-live="polite">
          {cancellationForBooking.status === 'pending' ? <><span className="spinner" /><strong>Cancelling request…</strong></> : null}
          {cancellationForBooking.status === 'success' ? <><span>✓</span><strong>{cancellationForBooking.message}</strong></> : null}
          {cancellationForBooking.status === 'error' ? <><span>!</span><strong>{cancellationForBooking.message}</strong></> : null}
        </div>
        <div className={`end-state ${endForSession.status}`} aria-live="polite">
          {endForSession.status === 'pending' ? <><span className="spinner" /><strong>Ending walk…</strong></> : null}
          {endForSession.status === 'success' ? <><span>✓</span><strong>{endForSession.message}</strong></> : null}
          {endForSession.status === 'error' ? <><span>!</span><strong>{endForSession.message}</strong></> : null}
        </div>
        {lifecycle.live && snapshot.session ? (
          <button
            className="button button-danger-ghost"
            disabled={endForSession.status === 'pending'}
            type="button"
            onClick={() => onEnd(snapshot.session!.id)}
          >
            {endForSession.status === 'pending' ? 'End pending' : endForSession.status === 'error' ? 'Retry end walk' : 'End walk'}
          </button>
        ) : null}
        {canCancel && cancellationForBooking.status !== 'success' ? (
          <button className="button button-danger-ghost" disabled={cancellationForBooking.status === 'pending'} type="button" onClick={() => onCancel(snapshot.request)}>
            {cancellationForBooking.status === 'pending' ? 'Cancellation pending' : cancellationForBooking.status === 'error' ? 'Retry cancellation' : 'Cancel before start'}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function formatRelative(date: Date, now: number) {
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatAge(ageSeconds: number | null) {
  if (ageSeconds === null) return 'not received';
  if (ageSeconds < 10) return 'just now';
  if (ageSeconds < 60) return `${ageSeconds}s ago`;
  return `${Math.floor(ageSeconds / 60)}m ago`;
}

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
