import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, liveWalkApi } from './api';
import { useAuth } from './auth';
import { AuthPanel } from './components/AuthPanel';
import { ActiveBookingPanel, type CancellationState } from './components/ActiveBookingPanel';
import { RequestCard } from './components/RequestCard';
import { RequestForm } from './components/RequestForm';
import { connectionAfterFailure, connectionAfterSuccess, mergeRequest, mergeRequestList, mergeSnapshot, pickResumableRequest, type ConnectionStatus } from './bookingModel';
import type { BookingSnapshot, WalkRequest } from './types';

export function App() {
  const auth = useAuth();
  if (auth.state === 'restoring') return <Restoring />;
  if (auth.state === 'anonymous') return <AuthPanel />;
  return <TravelerDashboard />;
}

function Restoring() {
  return <main className="restoring"><img src="/assets/livelywalk-icon.jpg" alt="LivelyWalk" /><span className="spinner" /><p>Restoring your Traveler session…</p></main>;
}

function TravelerDashboard() {
  const auth = useAuth();
  const [requests, setRequests] = useState<WalkRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [activeSnapshot, setActiveSnapshot] = useState<BookingSnapshot>();
  const [connection, setConnection] = useState<ConnectionStatus>('connecting');
  const [loading, setLoading] = useState(true);
  const [syncingList, setSyncingList] = useState(false);
  const [syncingActive, setSyncingActive] = useState(false);
  const [error, setError] = useState('');
  const [lastSynced, setLastSynced] = useState<Date>();
  const [cancellation, setCancellation] = useState<CancellationState>({ requestId: '', status: 'idle', message: '' });
  const selectedRequestIdRef = useRef('');
  const snapshotRef = useRef<BookingSnapshot | undefined>(undefined);
  const listRefreshInFlight = useRef(false);
  const activeRefreshInFlight = useRef(false);

  useEffect(() => {
    selectedRequestIdRef.current = selectedRequestId;
  }, [selectedRequestId]);

  const applySnapshot = useCallback((incoming: BookingSnapshot) => {
    const merged = mergeSnapshot(snapshotRef.current, incoming);
    snapshotRef.current = merged;
    setActiveSnapshot(merged);
    setRequests((current) => current.map((request) => request.id === merged.request.id ? mergeRequest(request, merged.request) : request));
    return merged;
  }, []);

  const refreshList = useCallback(async (quiet = false) => {
    if (!auth.token || listRefreshInFlight.current) return;
    listRefreshInFlight.current = true;
    if (!quiet) setSyncingList(true);
    try {
      const [, data] = await Promise.all([liveWalkApi.health(), liveWalkApi.listRequests(auth.token)]);
      setRequests((current) => {
        const merged = mergeRequestList(current, data.requests);
        const selectedExists = merged.some((request) => request.id === selectedRequestIdRef.current);
        if (!selectedExists) {
          const next = pickResumableRequest(merged) ?? merged[0] ?? null;
          selectedRequestIdRef.current = next?.id ?? '';
          setSelectedRequestId(next?.id ?? '');
        }
        return merged;
      });
      setLastSynced(new Date());
      setError('');
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) auth.expire();
      else setError(reason instanceof Error ? reason.message : 'Could not refresh your walks.');
    } finally {
      setLoading(false);
      setSyncingList(false);
      listRefreshInFlight.current = false;
    }
  }, [auth]);

  useEffect(() => {
    void refreshList();
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshList(true);
    }, 30000);
    const resume = () => { if (document.visibilityState === 'visible') void refreshList(true); };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
    };
  }, [refreshList]);

  const refreshActive = useCallback(async () => {
    const requestId = selectedRequestIdRef.current;
    if (!auth.token || !requestId || activeRefreshInFlight.current) return;
    activeRefreshInFlight.current = true;
    setSyncingActive(true);
    try {
      const detail = await liveWalkApi.getRequest(auth.token, requestId);
      if (selectedRequestIdRef.current !== requestId) return;
      let merged = applySnapshot({
        request: detail.request,
        session: detail.session,
        messages: snapshotRef.current?.request.id === requestId ? snapshotRef.current.messages : [],
        syncedAt: new Date().toISOString(),
      });
      const sessionId = detail.session?.id || detail.request.sessionId;
      if (sessionId) {
        const sessionData = await liveWalkApi.getSessionStatus(auth.token, sessionId);
        if (selectedRequestIdRef.current !== requestId) return;
        merged = applySnapshot({
          request: sessionData.request,
          session: sessionData.session,
          messages: sessionData.messages,
          syncedAt: new Date().toISOString(),
        });
      }
      if (selectedRequestIdRef.current === requestId) {
        setConnection(connectionAfterSuccess());
        setLastSynced(new Date(merged.syncedAt));
      }
      setError('');
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) auth.expire();
      else if (selectedRequestIdRef.current === requestId) setConnection(connectionAfterFailure(Boolean(snapshotRef.current)));
    } finally {
      activeRefreshInFlight.current = false;
      setSyncingActive(false);
    }
  }, [applySnapshot, auth]);

  useEffect(() => {
    if (!selectedRequestId) {
      snapshotRef.current = undefined;
      setActiveSnapshot(undefined);
      return;
    }
    const selected = requests.find((request) => request.id === selectedRequestId);
    if (selected && snapshotRef.current?.request.id !== selected.id) {
      const seeded: BookingSnapshot = { request: selected, session: null, messages: [], syncedAt: new Date().toISOString() };
      snapshotRef.current = seeded;
      setActiveSnapshot(seeded);
      setConnection('connecting');
      setCancellation({ requestId: '', status: 'idle', message: '' });
    }
    void refreshActive();
  }, [refreshActive, selectedRequestId]);

  useEffect(() => {
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshActive();
    }, 5000);
    const resume = () => { if (document.visibilityState === 'visible') void refreshActive(); };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
    };
  }, [refreshActive]);

  const created = (request: WalkRequest) => {
    const snapshot: BookingSnapshot = { request, session: null, messages: [], syncedAt: new Date().toISOString() };
    snapshotRef.current = snapshot;
    selectedRequestIdRef.current = request.id;
    setRequests((current) => mergeRequestList(current, [request, ...current.filter((item) => item.id !== request.id)]));
    setSelectedRequestId(request.id);
    setActiveSnapshot(snapshot);
    setConnection('online');
    setLastSynced(new Date());
    document.getElementById('your-walks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancel = async (request: WalkRequest) => {
    if (cancellation.status === 'pending') return;
    if (!window.confirm('Cancel this request? Guides will no longer be able to accept it.')) return;
    setCancellation({ requestId: request.id, status: 'pending', message: 'Cancelling request…' });
    setError('');
    try {
      const data = await liveWalkApi.cancelRequest(auth.token, request.id);
      applySnapshot({
        request: data.request,
        session: data.session,
        messages: snapshotRef.current?.request.id === request.id ? snapshotRef.current.messages : [],
        syncedAt: new Date().toISOString(),
      });
      setRequests((current) => current.map((item) => item.id === request.id ? mergeRequest(item, data.request) : item));
      setLastSynced(new Date());
      setConnection('online');
      setCancellation({ requestId: request.id, status: 'success', message: 'Cancellation confirmed. This request is closed.' });
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) auth.expire();
      else setCancellation({ requestId: request.id, status: 'error', message: reason instanceof Error ? reason.message : 'Cancellation failed. Try again.' });
    }
  };

  return (
    <div className="app-page">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="dashboard-brand" href="https://rendezvous-livewalk.webpeter.com" aria-label="LivelyWalk home">
            <img src="/assets/livelywalk-icon.jpg" alt="" /><span><strong>LivelyWalk</strong><small>TRAVELER</small></span>
          </a>
          <div className={`source-chip ${connection}`}><span className="live-dot" /><div><strong>{connection === 'reconnecting' ? 'Reconnecting' : 'Shared backend'}</strong><small>{lastSynced ? `Synced ${formatSync(lastSynced)}` : 'Connecting…'}</small></div></div>
          <div className="account-menu"><span className="avatar">{auth.user?.name.slice(0, 1).toUpperCase()}</span><span className="account-copy"><strong>{auth.user?.name}</strong><small>{auth.user?.email}</small></span><button type="button" onClick={() => void auth.signOut()} disabled={auth.busy}>Sign out</button></div>
        </div>
      </header>
      <main className="dashboard">
        <section className="dashboard-intro">
          <div><span className="overline">TRAVELER CONTROL</span><h1>Your window into the world.</h1><p>Create a real walk request, then follow the same booking your Guide sees.</p></div>
          <div className="truth-card"><span>◇</span><div><strong>One source of truth</strong><p>Quotes, requests and status come directly from the shared LivelyWalk backend.</p></div></div>
        </section>
        {error ? <div className="message error-message global-message" role="alert"><span>{error}</span><button type="button" onClick={() => void refreshList()}>Retry</button></div> : null}
        <div className="dashboard-grid">
          <RequestForm onCreated={created} />
          <section className="walks-column" id="your-walks" aria-labelledby="walks-heading">
            <div className="walks-heading">
              <div><span className="overline">SHARED MARKETPLACE</span><h2 id="walks-heading">Your walks</h2></div>
              <button className="refresh-button" type="button" onClick={() => { void refreshList(); void refreshActive(); }} disabled={syncingList || syncingActive}>{syncingList || syncingActive ? 'Refreshing…' : '↻ Refresh status'}</button>
            </div>
            {loading ? <div className="empty-state"><span className="spinner spinner-dark" /><h3>Loading your walks</h3><p>Reading the latest status from the shared backend.</p></div> : null}
            {!loading && requests.length === 0 ? <div className="empty-state"><span className="empty-icon">⌖</span><h3>No walk requests yet</h3><p>Your first real request will appear here as soon as the backend confirms it.</p></div> : null}
            {activeSnapshot ? (
              <ActiveBookingPanel
                snapshot={activeSnapshot}
                connection={connection}
                lastSuccessfulAt={lastSynced}
                refreshing={syncingActive}
                cancellation={cancellation}
                onRefresh={() => void refreshActive()}
                onCancel={(request) => void cancel(request)}
              />
            ) : null}
            {requests.length ? <div className="history-heading"><span>BOOKING HISTORY</span><small>Select a walk to inspect its confirmed state.</small></div> : null}
            <div className="request-list">
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  selected={selectedRequestId === request.id}
                  cancelling={cancellation.requestId === request.id && cancellation.status === 'pending'}
                  onSelect={(item) => {
                    selectedRequestIdRef.current = item.id;
                    setSelectedRequestId(item.id);
                  }}
                  onCancel={(item) => void cancel(item)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <footer><span>EXPERIENCE EVERYWHERE LIVE</span><p>Traveler v1 · Quotes and booking state are live · Payments, voice and video are outside this release.</p></footer>
    </div>
  );
}

function formatSync(date: Date) {
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  return seconds < 10 ? 'just now' : seconds < 60 ? `${seconds}s ago` : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
