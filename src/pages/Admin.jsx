import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, LogOut, RefreshCw, Eye, EyeOff, Inbox, Copy, Check, Shield } from 'lucide-react';
import gsap from 'gsap';
import { adminRequest } from './adminApi';
import SmoothField from '../components/booking/SmoothField';
import Dropdown from '../components/booking/Dropdown';
import CopyPill from '../components/CopyPill';
import './admin.css';


const statuses = ['All', 'New', 'In discussion', 'Quoted', 'Confirmed', 'Closed'];
const formatDate = value => value ? new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not specified';

function RefreshButton({ busy, onRefresh }) {
  const iconRef = useRef(null);
  const tweenRef = useRef(null);
  const spinningRef = useRef(false);

  const handleClick = e => {
    e.preventDefault();
    if (spinningRef.current) return;
    spinningRef.current = true;

    // Instant zero-lag hardware-accelerated spin on click/tap
    if (iconRef.current) {
      tweenRef.current?.kill();
      tweenRef.current = gsap.to(iconRef.current, {
        rotation: '+=360',
        duration: 0.75,
        ease: 'none',
        repeat: -1,
      });
    }

    onRefresh();
  };

  useEffect(() => {
    if (!busy && spinningRef.current) {
      spinningRef.current = false;
      if (iconRef.current) {
        const currentRot = gsap.getProperty(iconRef.current, 'rotation') || 0;
        const targetRot = Math.max(currentRot + 90, Math.ceil(currentRot / 360) * 360);
        tweenRef.current?.kill();
        tweenRef.current = gsap.to(iconRef.current, {
          rotation: targetRot,
          duration: 0.45,
          ease: 'power2.out',
          onComplete: () => {
            if (iconRef.current) gsap.set(iconRef.current, { rotation: 0 });
          },
        });
      }
    }
  }, [busy]);

  return (
    <button
      type="button"
      className="text-link admin-refresh-btn"
      onClick={handleClick}
      aria-label="Refresh inquiries"
      title="Refresh inquiries"
    >
      <span ref={iconRef} className="admin-refresh-icon-wrap" aria-hidden="true">
        <RefreshCw size={16} />
      </span>
      <span>Refresh</span>
    </button>
  );
}

function CopyButton({ text, label = 'Copy', className = '' }) {

  const [copied, setCopied] = useState(false);

  const handleCopy = async e => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      type="button"
      className={`admin-copy-btn ${copied ? 'is-copied' : ''} ${className}`}
      onClick={handleCopy}
      title={copied ? 'Copied!' : label}
      aria-label={copied ? 'Copied to clipboard' : label}
    >
      <span className="admin-copy-icon">
        {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      </span>
      <span className="admin-copy-text">{copied ? 'Copied!' : label}</span>
    </button>
  );
}


function PasswordField({
  id,
  name,
  label,
  autoComplete,
  required = false,
  minLength,
  maxLength,
  placeholder,
  helperText,
  helperAction,
  disabled = false,
  className = ''
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`admin-field-group ${className}`}>
      <div className="admin-label-row">
        <label htmlFor={id}>{label}</label>
        {helperAction || (helperText && <span className="admin-field-helper">{helperText}</span>)}
      </div>
      <div className="admin-password-field">
        <SmoothField
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          inputMode="text"
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          className="admin-eye-toggle"
          onClick={() => setVisible(v => !v)}
          aria-controls={id}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function SignIn({ onSignIn, configuration }) {
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('reset') || '');
  const [mode, setMode] = useState(() => token ? 'reset' : 'login');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const heading = useRef(null);

  useEffect(() => {
    if (token) window.history.replaceState(null, '', window.location.pathname);
  }, [token]);

  function switchMode(next) {
    setMode(next); setError(''); setNotice('');
    requestAnimationFrame(() => heading.current?.focus());
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    if (mode !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.'); return;
    }
    if (mode === 'reset' && data.get('password') !== data.get('confirm')) {
      setError('The passwords do not match.'); return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'forgot') {
        await adminRequest('auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
        setNotice('If this is an approved account, a reset link will arrive by email. Check your spam folder too. The link expires in 15 minutes.');
      } else if (mode === 'reset') {
        await adminRequest('auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword: data.get('password') }) });
        setToken(''); switchMode('login'); setNotice('Password updated. Sign in with your new password.');
      } else {
        await adminRequest('auth/sign-in/email', { method: 'POST', body: JSON.stringify({ email: email.trim(), password: data.get('password') }) });
        await onSignIn();
      }
    } catch {
      setError(mode === 'forgot' ? 'Could not send the reset link. Please try again shortly.' : mode === 'reset' ? 'This link may have expired or already been used. Request a new reset link.' : 'Unable to sign in. Check your email and password, or try again shortly.');
    } finally { setBusy(false); }
  }

  const recovering = mode !== 'login';

  return <>
    <header className="admin-login-header"><a className="text-link" href="/"><ArrowLeft size={16} aria-hidden="true" /> Back to website</a><p className="admin-wordmark">RYTHUM SHASTRI<span>.</span></p></header>
    <div className="admin-login-layout">
      <div className="admin-login-intro"><h1>Behind<br />the music.</h1><p>One place for every inquiry.<br />For Rythum and the team.</p></div>
      <section className="admin-login-card" aria-labelledby="admin-signin">
        <h2 id="admin-signin" ref={heading} tabIndex={-1}>{mode === 'forgot' ? 'Forgot password?' : mode === 'reset' ? 'A fresh start.' : 'Welcome back.'}</h2>
        <p>{mode === 'forgot' ? 'Enter your admin email to receive a reset link.' : mode === 'reset' ? 'Choose a new password for your workspace.' : 'Sign in to your private workspace.'}</p>
        <form onSubmit={submit} aria-busy={busy}><fieldset disabled={busy || !configuration.enabled} key={mode}>
          {mode !== 'reset' && (
            <div className="admin-field-group admin-login-field">
              <label htmlFor="admin-email">Email address</label>
              <SmoothField id="admin-email" name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint={mode === 'forgot' ? 'send' : 'next'} required placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} />
            </div>
          )}
          {mode !== 'forgot' && (
            <PasswordField
              id="admin-password"
              name="password"
              label={mode === 'reset' ? 'New password' : 'Password'}
              autoComplete={mode === 'reset' ? 'new-password' : 'current-password'}
              required
              minLength={mode === 'reset' ? 12 : undefined}
              maxLength={128}
              placeholder={mode === 'reset' ? 'At least 12 characters' : 'Enter your password'}
              helperAction={mode === 'login' ? <button className="admin-inline-link" type="button" onClick={() => switchMode('forgot')}>Forgot password?</button> : null}
              className="admin-login-field"
            />
          )}
          {mode === 'reset' && (
            <PasswordField
              id="admin-confirm"
              name="confirm"
              label="Confirm password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              placeholder="Re-enter your new password"
              className="admin-login-field"
            />
          )}
          {error && <p role="alert" className="admin-error">{error}</p>}
          {notice && <p role="status" className="admin-notice">{notice}</p>}
          {mode === 'forgot' && !configuration.resetEnabled ? <p role="status" className="admin-hint">Email recovery is not available yet. Contact the website administrator to restore access.</p> : <button className="button button-solid" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Save new password' : 'Sign in'}<ArrowRight size={18} aria-hidden="true" /></button>}
        </fieldset></form>
        {recovering && <button className="admin-inline-link admin-return" disabled={busy} type="button" onClick={() => switchMode('login')}><ArrowLeft size={16} aria-hidden="true" /> Back to sign in</button>}
        {mode === 'reset' && error && <button className="admin-inline-link admin-return" disabled={busy} type="button" onClick={() => switchMode('forgot')}>Request a new reset link</button>}
        {!configuration.enabled && <p role="alert" className="admin-error">Admin authentication is not configured yet.</p>}
      </section>
    </div>
  </>;
}

function Security({ user, onExpired }) {
  const [notice, setNotice] = useState({ text: '', type: '' });
  const [busy, setBusy] = useState(false);
  const [revokeBusy, setRevokeBusy] = useState(false);

  async function changePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const current = String(data.get('currentPassword') || '').trim();
    const next = String(data.get('newPassword') || '').trim();
    const confirm = String(data.get('confirm') || '').trim();

    if (!current) {
      setNotice({ text: 'Please enter your current password.', type: 'error' });
      return;
    }
    if (next !== confirm) {
      setNotice({ text: 'New passwords do not match. Please verify both fields.', type: 'error' });
      return;
    }
    if (next.length < 12) {
      setNotice({ text: 'New password must be at least 12 characters long.', type: 'error' });
      return;
    }

    setBusy(true);
    setNotice({ text: '', type: '' });
    try {
      await adminRequest('auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next, revokeOtherSessions: true })
      });
      form.reset();
      setNotice({ text: 'Password successfully updated! All other active sessions have been signed out.', type: 'success' });
    } catch (error) {
      if (error.status === 401) onExpired();
      else setNotice({ text: 'Unable to update password. Check your current password and try again.', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function revokeOthers() {
    setRevokeBusy(true);
    setNotice({ text: '', type: '' });
    try {
      await adminRequest('auth/revoke-other-sessions', { method: 'POST', body: '{}' });
      setNotice({ text: 'All other active devices have been signed out successfully.', type: 'success' });
    } catch (error) {
      if (error.status === 401) onExpired();
      else setNotice({ text: error.message || 'Failed to revoke other sessions.', type: 'error' });
    } finally {
      setRevokeBusy(false);
    }
  }

  return (
    <section className="admin-security">
      <div className="admin-security-heading">
        <p className="admin-account-tag">
          Signed in as <strong>{user?.email}</strong>
        </p>
        <h1>Account security</h1>
        <p className="admin-security-sub">
          You can stay signed in on multiple devices. Changing your password signs out all other sessions automatically.
        </p>
      </div>

      <div className="admin-security-grid">
        {/* Card 1: Change Password */}
        <div className="admin-security-card">
          <div className="admin-card-header">
            <h3>Change password</h3>
            <p>Ensure your account uses a secure password of at least 12 characters.</p>
          </div>

          <form onSubmit={changePassword} noValidate>
            <fieldset disabled={busy} className="admin-fieldset">
              <PasswordField
                id="sec-current-password"
                name="currentPassword"
                label="Current password"
                autoComplete="current-password"
                required
                placeholder="Enter current password"
              />

              <PasswordField
                id="sec-new-password"
                name="newPassword"
                label="New password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                placeholder="At least 12 characters"
                helperText="Min. 12 characters"
              />

              <PasswordField
                id="sec-confirm-password"
                name="confirm"
                label="Confirm new password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                placeholder="Re-enter new password"
              />

              {notice.text && (
                <div
                  className={`admin-security-notice ${notice.type === 'error' ? 'is-error' : 'is-success'}`}
                  role={notice.type === 'error' ? 'alert' : 'status'}
                >
                  {notice.type === 'success' ? <Check size={16} aria-hidden="true" /> : null}
                  <span>{notice.text}</span>
                </div>
              )}

              <div className="admin-security-actions">
                <button type="submit" className="button button-solid" disabled={busy}>
                  {busy ? 'Updating password…' : 'Update password'}
                </button>
              </div>
            </fieldset>
          </form>
        </div>

        {/* Card 2: Devices & Session Management */}
        <div className="admin-security-card admin-session-card">
          <div className="admin-card-header">
            <h3>Active sessions</h3>
            <p>Lost a device or signed in from a shared computer? Terminate all other browser sessions immediately.</p>
          </div>

          <div className="admin-session-box">
            <div className="admin-session-info">
              <span className="admin-session-status-dot" aria-hidden="true" />
              <div>
                <strong>Current session active</strong>
                <p>This browser will remain signed in.</p>
              </div>
            </div>

            <button
              type="button"
              className="button admin-revoke-btn"
              onClick={revokeOthers}
              disabled={revokeBusy || busy}
            >
              <Shield size={16} aria-hidden="true" />
              <span>{revokeBusy ? 'Signing out devices…' : 'Sign out other devices'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function InquiryInbox({ onExpired }) {
  const [filter, setFilter] = useState({ q: '', status: 'All', page: 1 });
  const [result, setResult] = useState({ items: [], total: 0, pages: 1 });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [refreshSpinning, setRefreshSpinning] = useState(false);
  const [selected, setSelected] = useState('');
  const [inquiry, setInquiry] = useState(null);
  const [detailError, setDetailError] = useState('');
  const title = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    adminRequest(`admin/inquiries?${new URLSearchParams(filter)}`, { signal: controller.signal }).then(setResult).catch(error => {
      if (controller.signal.aborted) return;
      if (error.status === 401) onExpired(); else setError(error.message);
    }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [filter, refresh, onExpired]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    adminRequest(`admin/inquiries/${encodeURIComponent(selected)}`, { signal: controller.signal }).then(data => {
      setInquiry(data.inquiry);
      requestAnimationFrame(() => title.current?.focus());
    }).catch(error => {
      if (controller.signal.aborted) return;
      if (error.status === 401) onExpired(); else setDetailError(error.message);
    });
    return () => controller.abort();
  }, [selected, onExpired]);

  function updateFilter(next) { setBusy(true); setError(''); setFilter(next); }

  function handleRefresh() {
    setBusy(true);
    setError('');
    setRefresh(v => v + 1);
  }

  if (selected) return <section className="admin-detail">
    <button type="button" className="text-link admin-back-btn" onClick={() => { setSelected(''); setInquiry(null); setDetailError(''); }}>
      <ArrowLeft size={16} /> Back to inbox
    </button>
    {detailError ? (
      <p role="alert" className="admin-error">{detailError}</p>
    ) : !inquiry ? (
      <div className="admin-detail-skeleton" aria-busy="true">
        <div className="admin-detail-heading">
          <div className="admin-skeleton admin-skeleton-h2" />
          <div className="admin-skeleton admin-skeleton-badge" />
        </div>
        <div className="admin-skeleton admin-skeleton-ref" />
        <div className="admin-detail-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i}>
              <div className="admin-skeleton admin-skeleton-dt" />
              <div className="admin-skeleton admin-skeleton-dd" />
            </div>
          ))}
        </div>
        <div className="admin-brief" style={{ marginTop: 24 }}>
          <div className="admin-skeleton admin-skeleton-h3" />
          <div className="admin-skeleton admin-skeleton-para" />
        </div>
      </div>
    ) : (
      <>
        <div className="admin-detail-heading">
          <h2 ref={title} tabIndex={-1}>{inquiry.name}</h2>
          <span className="admin-status">{inquiry.status}</span>
        </div>
        <div className="admin-reference-row">
          <CopyPill text={inquiry.reference} label="Reference ID" monospace />
        </div>
        <dl className="admin-detail-grid">
          {[
            ['Email', inquiry.email, true],
            ['Phone', inquiry.phone || 'Not provided', Boolean(inquiry.phone)],
            ['Event', inquiry.eventType, false],
            ['Location', inquiry.city, false],
            ['Proposed date', formatDate(inquiry.date), false],
            ['Submitted', formatDate(inquiry.createdAt), false]
          ].map(([key, value, canCopy]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd className="admin-detail-dd">
                <span>{value}</span>
                {canCopy && <CopyButton text={value} label="Copy" className="admin-copy-mini" />}
              </dd>
            </div>
          ))}
        </dl>

        <div className="admin-brief">
          <div className="admin-brief-header">
            <h3>Event brief</h3>
            {inquiry.details && <CopyButton text={inquiry.details} label="Copy brief" className="admin-copy-mini" />}
          </div>
          <p>{inquiry.details}</p>
        </div>
        <p className="admin-hint">Status updates, internal notes and website replies are coming next.</p>
      </>
    )}
  </section>;

  return <section className="admin-inbox">
    <div className="admin-inbox-heading">
      <div>
        <h1>Inquiries</h1>
        <p>Every conversation starts here.</p>
      </div>
      <RefreshButton busy={busy} onRefresh={handleRefresh} />
    </div>

    <div className="admin-toolbar">
      <form role="search" onSubmit={event => { event.preventDefault(); updateFilter({ ...filter, q: String(new FormData(event.currentTarget).get('q')).trim(), page: 1 }); }}>
        <div className="admin-search">
          <Search size={18} className="admin-search-icon" aria-hidden="true" />
          <SmoothField
            id="admin-search-input"
            name="q"
            type="text"
            defaultValue={filter.q}
            maxLength={120}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Search inquiries by name, email, city or reference"
            placeholder="Search name, email or city"
          />
        </div>
        <button type="submit" className="button button-solid">Search</button>
      </form>


      <div className="admin-status-field">
        <span className="admin-status-label">Status</span>
        <Dropdown
          id="admin-status-dropdown"
          label="Filter by status"
          value={filter.status}
          options={statuses.map(s => ({ value: s, label: s }))}
          onChange={val => updateFilter({ ...filter, status: val, page: 1 })}
        />
      </div>
    </div>

    <p className="admin-count" role="status">
      {busy ? 'Loading inquiries…' : `${result.total} ${result.total === 1 ? 'inquiry' : 'inquiries'}`}
    </p>

    {error ? (
      <p role="alert" className="admin-error">{error}</p>
    ) : busy ? (
      <div className="admin-inquiry-list" aria-busy="true">
        {[1, 2, 3, 4].map(idx => (
          <div className="admin-skeleton-row" key={idx}>
            <div>
              <div className="admin-skeleton admin-skeleton-title" style={{ width: `${140 + (idx % 3) * 45}px` }} />
              <div className="admin-skeleton admin-skeleton-subtitle" style={{ width: `${200 + (idx % 2) * 60}px` }} />
            </div>
            <div>
              <div className="admin-skeleton admin-skeleton-badge" />
            </div>
            <div>
              <div className="admin-skeleton admin-skeleton-date" />
            </div>
            <div className="admin-skeleton admin-skeleton-arrow" />
          </div>
        ))}
      </div>
    ) : result.items.length === 0 ? (
      <div className="admin-empty">
        <Inbox size={30} />
        <h2>No inquiries here yet.</h2>
        <p>New inquiries will appear here once submitted.</p>
      </div>
    ) : (
      <div className="admin-inquiry-list">
        {result.items.map(item => (
          <button
            type="button"
            className="admin-inquiry-row"
            key={item.reference}
            onClick={() => { setInquiry(null); setDetailError(''); setSelected(item.reference); }}
          >
            <div>
              <strong>{item.name}</strong>
              <span>{item.eventType} · {item.city}</span>
            </div>
            <span className="admin-status">{item.status}</span>
            <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
    )}

    <div className="admin-pagination">
      <button type="button" className="text-link" disabled={busy || filter.page === 1} onClick={() => updateFilter({ ...filter, page: filter.page - 1 })}>
        <ArrowLeft size={16} /> Previous
      </button>
      <span>Page {filter.page} of {result.pages}</span>
      <button type="button" className="text-link" disabled={busy || filter.page >= result.pages} onClick={() => updateFilter({ ...filter, page: filter.page + 1 })}>
        Next <ArrowRight size={16} />
      </button>
    </div>
  </section>;
}


function AdminNav({ screen, setScreen }) {
  const [slider, setSlider] = useState({ left: 0, width: 0, ready: false });
  const [shuttle, setShuttle] = useState({ left: 0, width: 0, active: false });
  const inboxRef = useRef(null);
  const securityRef = useRef(null);

  const updateSlider = useCallback(() => {
    const el = screen === 'inbox' ? inboxRef.current : securityRef.current;
    if (el) {
      setSlider({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    }
  }, [screen]);

  useEffect(() => {
    updateSlider();
    window.addEventListener('resize', updateSlider);
    return () => window.removeEventListener('resize', updateSlider);
  }, [updateSlider]);

  return (
    <nav
      aria-label="Admin navigation"
      onMouseLeave={() => setShuttle(s => ({ ...s, active: false }))}
    >
      <span
        className={`admin-nav-shuttle ${shuttle.active ? 'is-active' : ''}`}
        style={{
          transform: `translateX(${shuttle.left}px)`,
          width: `${shuttle.width}px`,
        }}
        aria-hidden="true"
      />
      <span
        className={`admin-nav-slider ${slider.ready ? 'is-ready' : ''}`}
        style={{
          transform: `translateX(${slider.left}px)`,
          width: `${slider.width}px`,
        }}
        aria-hidden="true"
      />
      <button
        ref={inboxRef}
        type="button"
        aria-current={screen === 'inbox' ? 'page' : undefined}
        onClick={() => setScreen('inbox')}
        onMouseEnter={e => setShuttle({ left: e.currentTarget.offsetLeft, width: e.currentTarget.offsetWidth, active: true })}
        onFocus={e => setShuttle({ left: e.currentTarget.offsetLeft, width: e.currentTarget.offsetWidth, active: true })}
      >
        Inquiries
      </button>
      <button
        ref={securityRef}
        type="button"
        aria-current={screen === 'security' ? 'page' : undefined}
        onClick={() => setScreen('security')}
        onMouseEnter={e => setShuttle({ left: e.currentTarget.offsetLeft, width: e.currentTarget.offsetWidth, active: true })}
        onFocus={e => setShuttle({ left: e.currentTarget.offsetLeft, width: e.currentTarget.offsetWidth, active: true })}
      >
        Security
      </button>
    </nav>
  );
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [configuration, setConfiguration] = useState(null);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState('inbox');
  async function loadSession() { const data = await adminRequest('admin/session'); setUser(data.user); }
  useEffect(() => {
    let active = true;
    adminRequest('admin/config').then(async config => {
      if (!active) return;
      setConfiguration(config);
      if (config.enabled) {
        try { const data = await adminRequest('admin/session'); if (active) setUser(data.user); }
        catch (error) { if (active && error.status !== 401) setError(error.message); }
      }
    }).catch(() => { if (active) setError('Unable to reach the admin service. Check the backend and refresh.'); });
    const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex, nofollow'; document.head.append(meta);
    return () => { active = false; meta.remove(); };
  }, []);
  // Stable callback prevents a session update from repeatedly fetching the inbox.
  const expire = useCallback(() => setUser(null), []);
  async function logout() {
    try { await adminRequest('auth/sign-out', { method: 'POST', body: '{}' }); setUser(null); }
    catch { setError('Could not sign out. Please try again.'); }
  }
  return <main className="admin-page">
    {error && <p className="admin-error" role="alert">{error}</p>}
    {!configuration ? (
      <div className="admin-page-skeleton" aria-busy="true">
        <header className="admin-header">
          <div className="admin-skeleton" style={{ width: 170, height: 24 }} />
          <div className="admin-skeleton" style={{ width: 180, height: 44, marginLeft: 'auto' }} />
        </header>
        <div className="admin-workspace">
          <div className="admin-skeleton" style={{ width: 220, height: 48, marginBottom: 36 }} />
          <div className="admin-skeleton-row" style={{ marginBottom: 12 }}>
            <div className="admin-skeleton" style={{ width: 200, height: 20 }} />
          </div>
          <div className="admin-skeleton-row">
            <div className="admin-skeleton" style={{ width: 240, height: 20 }} />
          </div>
        </div>
      </div>
    ) : !user ? <SignIn configuration={configuration} onSignIn={loadSession} /> : <>
      <header className="admin-header"><a href="/" className="admin-wordmark">RYTHUM SHASTRI<span>.</span></a><AdminNav screen={screen} setScreen={setScreen} /><button type="button" className="text-link" onClick={logout}><LogOut size={16} /> Sign out</button></header>
      <div className="admin-workspace">
        {screen === 'security' ? (
          <Security user={user} onExpired={expire} />
        ) : (
          <>
            <p className="admin-account">{user.email}</p>
            <InquiryInbox onExpired={expire} />
          </>
        )}
      </div>
    </>}
  </main>;
}

