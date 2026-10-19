import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { adminRequest } from './adminApi';
import SmoothField from '../components/booking/SmoothField';
import Conversation from './Conversation';
import InquiryAttachments from './InquiryAttachments';
import useRealtime from './useRealtime';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, LogOut, Mail, MessageCircle, RefreshCw, ShieldCheck, Paperclip } from 'lucide-react';
import '../components/booking/booking.css';
import './admin.css';
import './portal.css';

export default function Portal() {
  const [drafts, setDrafts] = useState({});
  const [activeTab, setActiveTab] = useState('chat');
  const segmentedRef = useRef(null);
  const tabRefs = useRef({});
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, ready: false });
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [customer, setCustomer] = useState(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState({ items: [], pages: 1 });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const expire = useCallback(() => { setCustomer(null); setSelected(null); setResult({ items: [], pages: 1 }); setDrafts({}); setNotice('Your session ended. Request a new sign-in link.'); }, []);
  const realtime = useRealtime('customer', expire, Boolean(customer) && !token);
  const active = result.items.find(item => item.reference === selected?.reference) || selected;
  useEffect(() => {
    window.history.replaceState(null, '', window.location.pathname);
    const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex, nofollow'; document.head.append(meta);
    let active = true;
    adminRequest('customer/session').then(data => { if (active) setCustomer(data.email); }).catch(error => { if (active && error.status !== 401) setError(error.message); }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; meta.remove(); };
  }, []);
  useEffect(() => {
    if (!customer) return;
    const controller = new AbortController();
    adminRequest(`customer/inquiries?page=${page}`, { signal: controller.signal }).then(setResult).catch(error => { if (!controller.signal.aborted) { if (error.status === 401) expire(); else setError(error.message); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [customer, page, refresh, expire, realtime.sequence]);
  async function requestLink(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { const data = await adminRequest('customer/request-link', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase() }) }); setNotice(data.message); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setError('');
    try { const data = await adminRequest('customer/verify', { method: 'POST', body: JSON.stringify({ token }) }); setDrafts({}); setPage(1); setCustomer(data.email); setToken(''); setNotice(''); setSelected(null); setLoading(true); setRefresh(value => value + 1); }
    catch (error) { setError(error.message); setToken(''); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    try { await adminRequest('customer/logout', { method: 'POST', body: '{}' }); expire(); setNotice('Signed out.'); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  useLayoutEffect(() => {
    const updateSlider = () => {
      const el = tabRefs.current[activeTab];
      const container = segmentedRef.current;
      if (el && container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        setSliderStyle({
          left: elRect.left - containerRect.left,
          width: elRect.width,
          ready: true,
        });
      }
    };

    updateSlider();
    document.fonts?.ready?.then(updateSlider);

    if (typeof ResizeObserver !== 'undefined' && segmentedRef.current) {
      const ro = new ResizeObserver(updateSlider);
      ro.observe(segmentedRef.current);
      return () => ro.disconnect();
    }
  }, [activeTab, selected?.reference]);

  return <main className={`portal-page ${customer && !token ? 'portal-signed-in' : ''}`}>
    <header className="portal-header"><a className="portal-home" href="/" aria-label="Back to website"><ArrowLeft size={17} /><span>Back to website</span></a><a href="/" className="portal-brand">RYTHUM SHASTRI<span>.</span></a>{customer && !token ? <button className="portal-logout" disabled={busy} onClick={logout}><LogOut size={16} /><span>Sign out</span></button> : <span className="portal-private"><ShieldCheck size={16} /> Private workspace</span>}</header>
    {checking ? <div className="portal-checking" role="status">Opening your workspace…</div> : !customer || token ? <div className="portal-entry">
      <div className="portal-entry-intro"><h1>Your event.<br />Our conversation.</h1><p>A direct line to Rythum’s team, from your first question to the final details.</p><a href="/#booking">Planning something new? <ArrowRight size={16} /></a></div>
      <section className="portal-login"><div className="portal-login-icon"><Mail size={24} /></div><h2>{token ? 'You’re one step away.' : 'Welcome back.'}</h2><p>{token ? 'Use your secure email link to open your inquiries.' : 'Enter the email you used for your inquiry. We’ll send you a secure sign-in link.'}</p>
        {error && <p role="alert" className="portal-alert">{error}</p>}{notice && <p role="status" className="portal-notice">{notice}</p>}
        {token ? <><button className="button button-solid" disabled={busy} onClick={verify}>{busy ? 'Signing in…' : 'Open my inquiries'}<ArrowRight size={18} /></button><button className="portal-text-button" disabled={busy} onClick={() => setToken('')}>Use another email</button></> : <form className="booking-form" onSubmit={requestLink}><fieldset disabled={busy}><label htmlFor="portal-email">Email address</label><SmoothField id="portal-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /><button className="button button-solid">{busy ? 'Sending link…' : 'Email me a sign-in link'}<ArrowRight size={18} /></button></fieldset></form>}
        <p className="portal-login-footnote"><ShieldCheck size={15} /> No password. Your link works once, for 15 minutes.</p>
      </section>
    </div> : <div className="portal-workspace">
      <div className="portal-workspace-heading"><div><h1>Your inquiries</h1><p>Everything for your event, in one conversation.</p></div><span className="portal-account">{customer}</span></div>
      {error && <p role="alert" className="portal-alert">{error}</p>}
      <div className={`portal-chat-layout ${active ? 'has-chat' : ''}`}>
        <aside className="portal-sidebar" aria-label="Your inquiries"><div className="portal-sidebar-heading"><h2>Conversations</h2><button className="chat-icon" disabled={loading} aria-label="Refresh inquiries" onClick={() => { setLoading(true); setRefresh(value => value + 1); }}><RefreshCw size={16} /></button></div>
          <div className="portal-thread-list">{loading && !result.items.length ? <p role="status">Loading inquiries…</p> : result.items.map(item => <button className={`portal-thread ${active?.reference === item.reference ? 'is-selected' : ''}`} key={item.reference} aria-current={active?.reference === item.reference ? 'true' : undefined} onClick={() => setSelected(item)}>
            <span className="portal-thread-top"><span className="portal-status">{item.status}</span><ChevronRight size={16} /></span><strong>{item.eventType}</strong><span>{item.city}</span><span className="portal-thread-date"><CalendarDays size={13} />{item.date ? new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date to be decided'}</span>
          </button>)}{!loading && !result.items.length && <div className="portal-no-inquiries"><MessageCircle size={24} /><p>No inquiries for this email yet.</p><a href="/#booking">Make an inquiry →</a></div>}</div>
          {result.pages > 1 && <div className="portal-pages"><button className="chat-icon" aria-label="Previous inquiries" disabled={loading || page === 1} onClick={() => { setLoading(true); setPage(page - 1); }}><ArrowLeft size={16} /></button><span>{page} / {result.pages}</span><button className="chat-icon" aria-label="Next inquiries" disabled={loading || page >= result.pages} onClick={() => { setLoading(true); setPage(page + 1); }}><ArrowRight size={16} /></button></div>}
          <p className="portal-sidebar-footnote"><ShieldCheck size={15} /> Only you and the team</p>
        </aside>
        <div className="portal-chat-panel">{active ? <>
          <header className="portal-chat-header">
            <button className="chat-icon portal-mobile-back" aria-label="Back to conversations" onClick={() => setSelected(null)}>
              <ArrowLeft size={20} />
            </button>
            <div className="portal-avatar" aria-hidden="true">RS</div>
            <div className="portal-chat-title">
              <h2>Rythum’s team</h2>
              <p>{active.eventType} · {active.city}</p>
            </div>
            <span className="portal-status">{active.status}</span>
          </header>

          {/* Apple iOS-Style Segmented Navigation Bar */}
          <div className="portal-nav-bar" role="tablist" aria-label="Inquiry Navigation">
            <div ref={segmentedRef} className="portal-segmented-control">
              <span
                className={`portal-slider-indicator ${sliderStyle.ready ? 'is-ready' : ''}`}
                style={{
                  width: `${sliderStyle.width}px`,
                  transform: `translate3d(${sliderStyle.left}px, 0, 0)`,
                }}
                aria-hidden="true"
              />

              <button
                ref={el => { tabRefs.current['chat'] = el; }}
                type="button"
                role="tab"
                aria-selected={activeTab === 'chat'}
                className={`portal-tab-pill ${activeTab === 'chat' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageCircle size={15} aria-hidden="true" />
                <span>Conversation</span>
              </button>

              <button
                ref={el => { tabRefs.current['documents'] = el; }}
                type="button"
                role="tab"
                aria-selected={activeTab === 'documents'}
                className={`portal-tab-pill ${activeTab === 'documents' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                <Paperclip size={15} aria-hidden="true" />
                <span>Documents & Files</span>
              </button>

              <button
                ref={el => { tabRefs.current['details'] = el; }}
                type="button"
                role="tab"
                aria-selected={activeTab === 'details'}
                className={`portal-tab-pill ${activeTab === 'details' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                <CalendarDays size={15} aria-hidden="true" />
                <span>Event Details</span>
              </button>
            </div>
          </div>

          <div key={activeTab} className="portal-tab-content-wrap">
            {activeTab === 'chat' ? (
              <Conversation
                key={active.reference}
                reference={active.reference}
                audience="customer"
                onExpired={expire}
                realtime={realtime}
                initialDraft={drafts[active.reference] || ''}
                onDraftChange={value => setDrafts(current => ({ ...current, [active.reference]: value }))}
              />
            ) : activeTab === 'documents' ? (
              <div className="portal-tab-content portal-documents-pane">
                <InquiryAttachments
                  key={`portal-att-${active.reference}`}
                  reference={active.reference}
                  audience="customer"
                  onExpired={expire}
                  realtime={realtime}
                />
              </div>
            ) : (
              <div className="portal-tab-content portal-details-pane">
                <div className="portal-detail-card">
                  <h3>Event Overview</h3>
                  <dl className="portal-detail-grid">
                    <div>
                      <dt>Event Type</dt>
                      <dd>{active.eventType}</dd>
                    </div>
                    <div>
                      <dt>City / Venue</dt>
                      <dd>{active.city}</dd>
                    </div>
                    <div>
                      <dt>Proposed Date</dt>
                      <dd>{active.date ? new Date(`${active.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date to be decided'}</dd>
                    </div>
                    <div>
                      <dt>Reference ID</dt>
                      <dd className="portal-mono-ref">{active.reference}</dd>
                    </div>
                  </dl>

                  {active.details && (
                    <div className="portal-brief-box">
                      <h4>Event Brief</h4>
                      <p>{active.details}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </> : <div className="portal-select-chat"><MessageCircle size={42} strokeWidth={1.2} /><h2>A little planning.<br />A great night.</h2><p>Select an inquiry to chat with the team and keep your event details together.</p></div>}</div>
      </div>
    </div>}
  </main>;
}
