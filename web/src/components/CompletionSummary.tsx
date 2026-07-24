import type { BookingSnapshot } from '../types';

export function CompletionSummary({ snapshot }: { snapshot: BookingSnapshot }) {
  const { request, session } = snapshot;
  if (request.status !== 'completed' && session?.status !== 'ended') return null;

  const money = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: request.estimate.currency,
    maximumFractionDigits: 0,
  }).format(request.estimate.total);

  return (
    <section className="completion-summary" aria-labelledby="completion-summary-heading">
      <div className="completion-heading">
        <div><span>✓</span></div>
        <div>
          <small>COMPLETED SESSION</small>
          <h4 id="completion-summary-heading">Your walk is complete</h4>
          <p>This summary uses the timestamps and booking details confirmed by LivelyWalk.</p>
        </div>
      </div>
      <dl className="completion-facts">
        <div><dt>Guide</dt><dd>{request.guide?.name || 'Not recorded'}</dd></div>
        <div><dt>Started</dt><dd>{formatDateTime(session?.startedAt)}</dd></div>
        <div><dt>Ended</dt><dd>{formatDateTime(session?.endedAt)}</dd></div>
        <div><dt>Actual session time</dt><dd>{actualDuration(session?.startedAt, session?.endedAt)}</dd></div>
        <div><dt>Planned duration</dt><dd>{request.durationMinutes} min</dd></div>
        <div><dt>Stored estimate</dt><dd>{money}</dd></div>
      </dl>
      <div className="completion-route">
        <span>RECORDED ENDPOINTS</span>
        <strong>{request.origin.label}</strong>
        <i>→</i>
        <strong>{request.destination.label}</strong>
      </div>
      <p className="completion-note">
        Stored estimate: {request.estimate.distanceKm} km · {request.estimate.walkingMinutes} min walking · {money}. This is the original booking estimate, not a receipt or charged total.
      </p>
    </section>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    : 'Not recorded';
}

function actualDuration(startedAt?: string | null, endedAt?: string | null) {
  const started = Date.parse(String(startedAt || ''));
  const ended = Date.parse(String(endedAt || ''));
  if (!Number.isFinite(started) || !Number.isFinite(ended) || ended < started) return 'Not recorded';
  const minutes = Math.max(1, Math.round((ended - started) / 60_000));
  return `${minutes} min`;
}
