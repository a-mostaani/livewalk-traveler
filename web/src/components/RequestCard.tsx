import { cancellableStatuses, presentStatus } from '../requestModel';
import type { WalkRequest } from '../types';

const timeline = ['Requested', 'Booked', 'Confirmed', 'Live', 'Completed'];

export function RequestCard({
  request,
  cancelling,
  selected = false,
  onSelect,
  onCancel,
}: {
  request: WalkRequest;
  cancelling: boolean;
  selected?: boolean;
  onSelect?: (request: WalkRequest) => void;
  onCancel: (request: WalkRequest) => void;
}) {
  const status = presentStatus(request.status);
  const canCancel = cancellableStatuses.includes(request.status);
  const start = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(request.scheduledStart));
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: request.estimate.currency, maximumFractionDigits: 0 }).format(request.estimate.total);

  return (
    <article className={`request-card status-${status.tone}${selected ? ' selected' : ''}`} aria-current={selected ? 'true' : undefined}>
      <div className="request-card-top">
        <span className={`status-badge ${status.tone}`}>{request.status === 'live' ? <span className="live-dot" /> : null}{status.label}</span>
        <span className="request-id">{request.id.slice(-8).toUpperCase()}</span>
      </div>
      <h3>{request.origin.label}</h3>
      <div className="route-arrow"><span /> <b>→</b></div>
      <h3>{request.destination.label}</h3>
      <div className="request-meta">
        <div><span>When</span><strong>{start}</strong></div>
        <div><span>Duration</span><strong>{request.durationMinutes} min</strong></div>
        <div><span>Server quote</span><strong>{money}</strong></div>
        <div><span>Guide</span><strong>{request.guide?.name || 'Matching now'}</strong></div>
      </div>
      {!status.cancelled ? (
        <ol className="status-timeline" aria-label="Booking status">
          {timeline.map((label, index) => <li key={label} className={index + 1 < status.step ? 'done' : index + 1 === status.step ? 'current' : ''}><span>{index + 1 < status.step ? '✓' : index + 1}</span><small>{label}</small></li>)}
        </ol>
      ) : null}
      <div className="request-card-foot">
        <div><strong>{status.detail}</strong><span>Live status from the shared backend</span></div>
        <div className="request-card-actions">
          {onSelect ? <button className="button button-secondary view-booking" type="button" onClick={() => onSelect(request)}>{selected ? 'Viewing details' : 'View details'}</button> : null}
          {canCancel ? <button className="button button-danger-ghost" disabled={cancelling} type="button" onClick={() => onCancel(request)}>{cancelling ? 'Cancelling…' : 'Cancel before start'}</button> : null}
        </div>
      </div>
    </article>
  );
}
