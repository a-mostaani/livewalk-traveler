import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ApiError, liveWalkApi } from './api';
import { useAuth } from './auth';
import { AuthPanel } from './components/AuthPanel';
import { RequestCard } from './components/RequestCard';
import { RequestForm } from './components/RequestForm';
import type { WalkRequest } from './types';

// livekit-client is a large SDK (~700KB) - only the traveler who actually
// opens a live session should pay for downloading it, not every dashboard visit.
const LiveSessionPanel = lazy(() => import('./components/LiveSessionPanel').then((module) => ({ default: module.LiveSessionPanel })));

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
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [lastSynced, setLastSynced] = useState<Date>();
  const [cancellingId, setCancellingId] = useState('');
  const [liveRequestId, setLiveRequestId] = useState('');

  const refresh = useCallback(async (quiet = false) => {
    if (!auth.token) return;
    if (!quiet) setSyncing(true);
    try {
      const [, data] = await Promise.all([liveWalkApi.health(), liveWalkApi.listRequests(auth.token)]);
      setRequests(data.requests);
      setLastSynced(new Date());
      setError('');
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) auth.expire();
      else setError(reason instanceof Error ? reason.message : 'Could not refresh your walks.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [auth]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh(true);
    }, 6000);
    const resume = () => { if (document.visibilityState === 'visible') void refresh(true); };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
    };
  }, [refresh]);

  const created = (request: WalkRequest) => {
    setRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
    setLastSynced(new Date());
    document.getElementById('your-walks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const liveRequest = requests.find((item) => item.id === liveRequestId && item.status === 'live');

  const walkEnded = (updated: WalkRequest) => {
    setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
    setLastSynced(new Date());
    setLiveRequestId('');
  };

  const cancel = async (request: WalkRequest) => {
    if (!window.confirm('Cancel this request? Guides will no longer be able to accept it.')) return;
    setCancellingId(request.id);
    setError('');
    try {
      const data = await liveWalkApi.cancelRequest(auth.token, request.id);
      setRequests((current) => current.map((item) => item.id === request.id ? data.request : item));
      setLastSynced(new Date());
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) auth.expire();
      else setError(reason instanceof Error ? reason.message : 'Could not cancel this request.');
    } finally {
      setCancellingId('');
    }
  };

  return (
    <div className="app-page">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="dashboard-brand" href="https://rendezvous-livewalk.webpeter.com" aria-label="LivelyWalk home">
            <img src="/assets/livelywalk-icon.jpg" alt="" /><span><strong>LivelyWalk</strong><small>TRAVELER</small></span>
          </a>
          <div className="source-chip"><span className="live-dot" /><div><strong>Shared backend</strong><small>{lastSynced ? `Synced ${formatSync(lastSynced)}` : 'Connecting…'}</small></div></div>
          <div className="account-menu"><span className="avatar">{auth.user?.name.slice(0, 1).toUpperCase()}</span><span className="account-copy"><strong>{auth.user?.name}</strong><small>{auth.user?.email}</small></span><button type="button" onClick={() => void auth.signOut()} disabled={auth.busy}>Sign out</button></div>
        </div>
      </header>
      <main className="dashboard">
        <section className="dashboard-intro">
          <div><span className="overline">TRAVELER CONTROL</span><h1>Your window into the world.</h1><p>Create a real walk request, then follow the same booking your Guide sees.</p></div>
          <div className="truth-card"><span>◇</span><div><strong>One source of truth</strong><p>Quotes, requests and status come directly from the shared LivelyWalk backend.</p></div></div>
        </section>
        {error ? <div className="message error-message global-message" role="alert"><span>{error}</span><button type="button" onClick={() => void refresh()}>Retry</button></div> : null}
        {liveRequest ? (
          <Suspense fallback={<div className="live-session-panel live-session-loading"><span className="spinner" /> Loading live session…</div>}>
            <LiveSessionPanel
              token={auth.token}
              request={liveRequest}
              onClose={() => setLiveRequestId('')}
              onEnded={walkEnded}
            />
          </Suspense>
        ) : null}
        <div className="dashboard-grid">
          <RequestForm onCreated={created} />
          <section className="walks-column" id="your-walks" aria-labelledby="walks-heading">
            <div className="walks-heading">
              <div><span className="overline">SHARED MARKETPLACE</span><h2 id="walks-heading">Your walks</h2></div>
              <button className="refresh-button" type="button" onClick={() => void refresh()} disabled={syncing}>{syncing ? 'Refreshing…' : '↻ Refresh status'}</button>
            </div>
            {loading ? <div className="empty-state"><span className="spinner spinner-dark" /><h3>Loading your walks</h3><p>Reading the latest status from the shared backend.</p></div> : null}
            {!loading && requests.length === 0 ? <div className="empty-state"><span className="empty-icon">⌖</span><h3>No walk requests yet</h3><p>Your first real request will appear here as soon as the backend confirms it.</p></div> : null}
            <div className="request-list">
              {requests.map((request) => <RequestCard key={request.id} request={request} cancelling={cancellingId === request.id} onCancel={(item) => void cancel(item)} onJoinLive={(item) => setLiveRequestId(item.id)} />)}
            </div>
          </section>
        </div>
      </main>
      <footer><span>EXPERIENCE EVERYWHERE LIVE</span><p>Traveler v1 · Quotes, booking, and the live session (video, map, messages) are live · Payments and two-way voice are outside this release.</p></footer>
    </div>
  );
}

function formatSync(date: Date) {
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  return seconds < 10 ? 'just now' : seconds < 60 ? `${seconds}s ago` : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
