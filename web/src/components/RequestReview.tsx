import type { Quote, RequestDraft } from '../types';
import { EndpointMap } from './EndpointMap';

export function RequestReview({
  draft,
  quote,
  busy,
  onEdit,
  onConfirm,
}: {
  draft: RequestDraft;
  quote: Quote;
  busy: boolean;
  onEdit: () => void;
  onConfirm: () => void;
}) {
  const start = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(draft.scheduledStart));
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: quote.currency, maximumFractionDigits: 0 });

  return (
    <section className="request-review" aria-labelledby="request-review-title">
      <div className="review-heading">
        <div>
          <span className="overline">REQUEST REVIEW</span>
          <h3 id="request-review-title">Confirm the walk details</h3>
        </div>
        <span className="step-chip">02 · REVIEW</span>
      </div>

      <EndpointMap origin={draft.origin} destination={draft.destination} />

      <div className="review-route" aria-label="Selected route endpoints">
        <div><span>A · START</span><strong>{draft.origin.label}</strong></div>
        <div><span>B · FINISH</span><strong>{draft.destination.label}</strong></div>
      </div>

      <dl className="review-facts">
        <div><dt>Scheduled</dt><dd>{start}</dd></div>
        <div><dt>Requested duration</dt><dd>{draft.durationMinutes} min</dd></div>
        <div><dt>Guide language</dt><dd>{draft.language}</dd></div>
        <div><dt>Interests</dt><dd>{draft.interests.length ? draft.interests.join(', ') : 'None selected'}</dd></div>
      </dl>

      <div className="review-quote">
        <div>
          <span>CURRENT SERVER QUOTE</span>
          <strong>{money.format(quote.total)}</strong>
        </div>
        <dl>
          <div><dt>Estimated distance</dt><dd>{quote.distanceKm} km</dd></div>
          <div><dt>Walking estimate</dt><dd>{quote.walkingMinutes} min</dd></div>
          <div><dt>Guide estimate</dt><dd>{money.format(quote.guideFee)}</dd></div>
          <div><dt>Platform estimate</dt><dd>{money.format(quote.platformFee)}</dd></div>
        </dl>
        <p>Quote confirmed by the LivelyWalk server for these exact details.</p>
      </div>

      <div className="review-actions">
        <button className="button button-secondary" type="button" onClick={onEdit} disabled={busy}>Edit details</button>
        <button className="button button-primary" type="button" onClick={onConfirm} disabled={busy}>
          {busy ? <span className="spinner" /> : null}{busy ? 'Sending request…' : 'Confirm and request guide'}
        </button>
      </div>
    </section>
  );
}
