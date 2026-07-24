import { type FormEvent, useState } from 'react';
import { useAuth } from '../auth';
import { AndroidDownload } from './AndroidDownload';

export function AuthPanel() {
  const auth = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'register') await auth.register(name.trim(), email.trim(), password);
    else await auth.login(email.trim(), password);
  };

  return (
    <div className="auth-page">
      <div className="auth-ambient auth-ambient-one" />
      <div className="auth-ambient auth-ambient-two" />
      <header className="auth-brand">
        <img src="/assets/livelywalk-icon.jpg" alt="" className="brand-icon" />
        <div><strong>LivelyWalk</strong><span>Traveler</span></div>
      </header>
      <main className="auth-layout">
        <section className="auth-story">
          <div className="eyebrow"><span className="live-dot" /> EXPERIENCE EVERYWHERE LIVE</div>
          <h1>Be there,<br /><span>from anywhere.</span></h1>
          <p>Request a trusted local guide and experience a place in real time, through their eyes and yours.</p>
          <div className="promise-grid">
            <div><b>01</b><span>Choose two real places</span></div>
            <div><b>02</b><span>Get a server-calculated quote</span></div>
            <div><b>03</b><span>Follow your booking live</span></div>
          </div>
        </section>
        <section className="auth-card" aria-label="Traveler account">
          <div className="auth-tabs" role="tablist" aria-label="Account mode">
            <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>Sign in</button>
            <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>Create account</button>
          </div>
          <div className="auth-heading">
            <span className="overline">TRAVELER ACCESS</span>
            <h2>{mode === 'login' ? 'Welcome back' : 'Start exploring'}</h2>
            <p>{mode === 'login' ? 'Your current bookings will restore after sign-in.' : 'Create your Traveler profile in under a minute.'}</p>
          </div>
          <form onSubmit={submit}>
            {mode === 'register' ? (
              <label>
                <span>Your name</span>
                <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="How guides will know you" />
              </label>
            ) : null}
            <label>
              <span>Email</span>
              <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              <span>Password</span>
              <input required minLength={6} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" />
            </label>
            {auth.error ? <div className="message error-message" role="alert">{auth.error}</div> : null}
            <button className="button button-primary button-wide" disabled={auth.busy} type="submit">
              {auth.busy ? <span className="spinner" /> : null}
              {auth.busy ? 'Connecting…' : mode === 'login' ? 'Enter Traveler' : 'Create Traveler account'}
            </button>
          </form>
          <p className="security-note"><span>◆</span> Your session stays in this browser tab and clears when you sign out.</p>
        </section>
      </main>
      <div className="auth-download-wrap">
        <AndroidDownload />
      </div>
    </div>
  );
}
