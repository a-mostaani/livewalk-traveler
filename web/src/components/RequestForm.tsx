import { useMemo, useState } from 'react';
import type { LiveWalkApiSurface } from '../api';
import { ApiError, liveWalkApi } from '../api';
import { useAuth } from '../auth';
import { canSubmitQuotedRequest, hasRouteCoordinates, requestFingerprint } from '../requestModel';
import type { Quote, RequestDraft, WalkRequest } from '../types';
import { PlaceSearch } from './PlaceSearch';
import { RequestReview } from './RequestReview';

const languages = ['English', 'Spanish', 'French', 'Arabic', 'Japanese'];
const interests = ['Local stories', 'Food stops', 'Hidden corners', 'Architecture', 'Photo moments'];

function futureStart() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return date.toISOString();
}

function localInputValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function RequestForm({
  onCreated,
  apiClient = liveWalkApi,
}: {
  onCreated: (request: WalkRequest) => void;
  apiClient?: LiveWalkApiSurface;
}) {
  const auth = useAuth();
  const [draft, setDraft] = useState<RequestDraft>({
    origin: { label: '' },
    destination: { label: '' },
    scheduledStart: futureStart(),
    durationMinutes: 45,
    language: 'English',
    interests: ['Local stories'],
  });
  const [quote, setQuote] = useState<Quote>();
  const [quoteFingerprint, setQuoteFingerprint] = useState('');
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');
  const [activePlaceField, setActivePlaceField] = useState<'origin' | 'destination' | null>(null);
  const routeReady = hasRouteCoordinates(draft);
  const quoteCurrent = quoteFingerprint === requestFingerprint(draft) && Boolean(quote);
  const submitReady = canSubmitQuotedRequest(draft, quoteFingerprint, quoteBusy || submitBusy) && Boolean(quote);

  const money = useMemo(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: quote?.currency || 'USD', maximumFractionDigits: 0 }), [quote?.currency]);

  const changeDraft = (next: RequestDraft) => {
    setDraft(next);
    setReviewing(false);
    setError('');
  };

  const handleUnauthorized = (reason: unknown) => {
    if (reason instanceof ApiError && reason.status === 401) auth.expire();
  };

  const getQuote = async () => {
    if (!routeReady) {
      setError('Select a Mapbox result for both places first.');
      return;
    }
    if (Date.parse(draft.scheduledStart) <= Date.now()) {
      setError('Choose a start time in the future.');
      return;
    }
    setQuoteBusy(true);
    setQuote(undefined);
    setQuoteFingerprint('');
    setError('');
    try {
      const fingerprint = requestFingerprint(draft);
      const data = await apiClient.estimate(auth.token, draft);
      setQuote(data.estimate);
      setQuoteFingerprint(fingerprint);
    } catch (reason) {
      handleUnauthorized(reason);
      setError(reason instanceof Error ? reason.message : 'Could not calculate your quote.');
    } finally {
      setQuoteBusy(false);
    }
  };

  const submit = async () => {
    if (!submitReady) {
      setError('Get a current server quote before submitting.');
      return;
    }
    setSubmitBusy(true);
    setError('');
    try {
      const data = await apiClient.createRequest(auth.token, draft);
      onCreated(data.request);
      setQuote(undefined);
      setQuoteFingerprint('');
      setReviewing(false);
    } catch (reason) {
      handleUnauthorized(reason);
      setError(reason instanceof Error ? reason.message : 'Could not submit your request.');
    } finally {
      setSubmitBusy(false);
    }
  };

  const toggleInterest = (interest: string) => {
    const selected = draft.interests.includes(interest);
    changeDraft({ ...draft, interests: selected ? draft.interests.filter((item) => item !== interest) : [...draft.interests, interest] });
  };

  return (
    <section className="panel request-panel" aria-labelledby="request-title">
      <div className="panel-heading">
        <div><span className="overline">NEW EXPERIENCE</span><h2 id="request-title">Where should we take you?</h2></div>
        <div className="step-chip">01 · ROUTE</div>
      </div>
      <p className="panel-intro">Choose two real places. Your quote and booking are calculated by the shared LivelyWalk backend.</p>
      {reviewing && quoteCurrent && quote ? (
        <RequestReview
          draft={draft}
          quote={quote}
          busy={submitBusy}
          onEdit={() => setReviewing(false)}
          onConfirm={() => void submit()}
        />
      ) : (
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!submitReady) {
          setError('Get a current server quote before reviewing your request.');
          return;
        }
        setReviewing(true);
      }}>
        <div className="route-stack">
          <PlaceSearch
            label="Starting point"
            placeholder="Search a place or landmark"
            value={draft.origin}
            active={activePlaceField === 'origin'}
            onActivate={() => setActivePlaceField('origin')}
            onDeactivate={() => setActivePlaceField((current) => current === 'origin' ? null : current)}
            onChange={(origin) => changeDraft({ ...draft, origin })}
          />
          <div className="route-line" aria-hidden="true" />
          <PlaceSearch
            label="Destination"
            placeholder="Where should the guide finish?"
            value={draft.destination}
            active={activePlaceField === 'destination'}
            onActivate={() => setActivePlaceField('destination')}
            onDeactivate={() => setActivePlaceField((current) => current === 'destination' ? null : current)}
            onChange={(destination) => changeDraft({ ...draft, destination })}
          />
        </div>
        <div className="form-grid">
          <label>
            <span>Start date & time</span>
            <input type="datetime-local" required value={localInputValue(draft.scheduledStart)} onChange={(event) => {
              const parsed = new Date(event.target.value);
              if (Number.isFinite(parsed.getTime())) changeDraft({ ...draft, scheduledStart: parsed.toISOString() });
            }} />
          </label>
          <label>
            <span>Duration</span>
            <select value={draft.durationMinutes} onChange={(event) => changeDraft({ ...draft, durationMinutes: Number(event.target.value) })}>
              <option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option><option value={90}>90 minutes</option>
            </select>
          </label>
          <label>
            <span>Guide language</span>
            <select value={draft.language} onChange={(event) => changeDraft({ ...draft, language: event.target.value })}>
              {languages.map((language) => <option value={language} key={language}>{language}</option>)}
            </select>
          </label>
        </div>
        <fieldset className="interest-fieldset">
          <legend>What are you curious about?</legend>
          <div className="interest-list">
            {interests.map((interest) => <button type="button" key={interest} className={draft.interests.includes(interest) ? 'selected' : ''} onClick={() => toggleInterest(interest)}>{draft.interests.includes(interest) ? '✓ ' : '+ '}{interest}</button>)}
          </div>
        </fieldset>
        {error ? <div className="message error-message" role="alert">{error}</div> : null}
        <div className="quote-area">
          <button className="button button-secondary" type="button" onClick={getQuote} disabled={!routeReady || quoteBusy || submitBusy}>
            {quoteBusy ? <span className="spinner spinner-dark" /> : null}{quoteBusy ? 'Calculating…' : quoteCurrent ? 'Refresh server quote' : 'Get server quote'}
          </button>
          {quoteCurrent && quote ? (
            <div className="quote-card" aria-label="Server quote preview">
              <div><span>{quote.distanceKm} km route · approx. {quote.walkingMinutes} min walking</span><strong>{money.format(quote.total)}</strong></div>
              <dl><div><dt>Guide</dt><dd>{money.format(quote.guideFee)}</dd></div><div><dt>Platform</dt><dd>{money.format(quote.platformFee)}</dd></div></dl>
              <p><span>✓</span> Calculated by the LivelyWalk server</p>
            </div>
          ) : null}
        </div>
        <button className="button button-primary button-wide submit-request" disabled={!submitReady} type="submit">
          Review this request
        </button>
        {!quoteCurrent ? <p className="submit-note">A current server quote is required before submission.</p> : null}
      </form>
      )}
    </section>
  );
}
