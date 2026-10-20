import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Pencil, X, Check, Clock, ChevronDown } from 'lucide-react';
import { adminRequest } from './adminApi';
import SmoothField from '../components/booking/SmoothField';
import Dropdown from '../components/booking/Dropdown';
import DatePicker from '../components/booking/DatePicker';

const types = ['Navratri / Garba', 'Concert / Festival', 'Wedding / Sangeet', 'Private / Corporate event', 'Studio collaboration'];
const labels = { eventType: 'Event type', city: 'Location', date: 'Event date', details: 'Event brief' };
const titles = { edit: 'Team updated event details', request: 'Change requested', approve: 'Change approved', reject: 'Change declined' };
function value(field, text) { return field === 'date' && text ? new Date(`${text}T12:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : text || 'Not set'; }
function Comparison({ before, after }) {
  return <dl className="event-change-comparison">{Object.keys(labels).filter(field => before[field] !== after[field]).map(field => <div key={field}><dt>{labels[field]}</dt><dd><span>{value(field, before[field])}</span><ArrowRight size={15} aria-label="changed to" /><strong>{value(field, after[field])}</strong></dd></div>)}</dl>;
}
export default function EventDetailsEditor({ reference, audience, status, realtime, onExpired, onSaved }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [reason, setReason] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const dialog = useRef(null);
  const attempt = useRef(null);
  const path = `${audience}/inquiries/${reference}/event`;
  const load = useCallback(async signal => {
    const result = await adminRequest(path, { signal });
    return result;
  }, [path]);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(setData).catch(error => { if (!controller.signal.aborted) { if (error.status === 401) onExpired(); else setError(error.message); } });
    return () => controller.abort();
  }, [load, onExpired, realtime?.sequence]);
  useEffect(() => {
    if (!editing) return;
    const element = dialog.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [editing]);
  function open() { setDraft({ event: { ...data.event }, revision: data.revision }); setReason(''); setError(''); setNotice(''); attempt.current = null; setEditing(true); }
  async function save(action) {
    if (busy) return;
    const command = { action, revision: editing ? draft.revision : data.revision, reason: (editing ? reason : decisionReason).trim(), ...(editing ? { event: draft.event } : { requestId: data.pending.id }) };
    if (!command.reason) { setError('Add a reason so everyone understands this change.'); return; }
    const serialized = JSON.stringify(command);
    if (attempt.current?.serialized !== serialized) attempt.current = { serialized, key: crypto.randomUUID() };
    setBusy(true); setError(''); setNotice('');
    try {
      await adminRequest(path, { method: 'POST', body: JSON.stringify({ ...command, key: attempt.current.key }) });
      setEditing(false); setDecisionReason(''); attempt.current = null;
      setNotice(action === 'request' ? 'Request sent. Current event details stay unchanged until the team approves.' : 'Saved. The client can review the update in their portal.');
      setData(await load());
      await onSaved?.();
    } catch (error) { if (error.status === 401) onExpired(); else setError(error.message); }
    finally { setBusy(false); }
  }
  async function more() {
    setBusy(true); setError('');
    try { const next = await adminRequest(`${path}?before=${data.next}`); setData(previous => ({ ...previous, next: next.next, items: [...previous.items, ...next.items.filter(item => !previous.items.some(old => old.id === item.id))] })); }
    catch (error) { if (error.status === 401) onExpired(); else setError(error.message); }
    finally { setBusy(false); }
  }
  return <section className="event-change-card" aria-label="Event changes">
    <div className="event-change-heading"><div><h3>Event changes</h3><p>{audience === 'admin' ? 'Update details or review a client’s request.' : 'Need to change something? Send a request to the team.'}</p></div>{data && !data.pending && status !== 'Closed' && <button type="button" className="text-link" onClick={open}><Pencil size={16} />{audience === 'admin' ? 'Edit details' : 'Request a change'}</button>}</div>
    {!data && !error && <p role="status">Loading event changes…</p>}
    {error && !editing && <div role="alert" className="admin-error">{error}<button type="button" className="text-link" disabled={busy} onClick={() => { setError(''); load().then(setData).catch(error => { if (error.status === 401) onExpired(); else setError(error.message); }); }}>Reload details</button></div>}
    {notice && <p role="status" className="admin-notice">{notice}</p>}
    {status === 'Closed' && <p className="admin-hint">This inquiry is closed. Discuss reopening it with the team before changing details.</p>}
    {data?.pending && <div className="event-pending"><span className="event-pending-label"><Clock size={16} />Awaiting team review</span><p className="event-change-reason">{data.pending.reason}</p><Comparison before={data.pending.before} after={data.pending.event} />
      {audience === 'admin' && status !== 'Closed' ? <form onSubmit={event => { event.preventDefault(); save('approve'); }}><label htmlFor="change-decision">Reason / reply to client</label><SmoothField multiline id="change-decision" value={decisionReason} maxLength={1000} required onChange={event => setDecisionReason(event.target.value)} placeholder="Explain your decision. This reply is visible to the client." /><div className="event-change-actions"><button className="button button-solid" disabled={busy}><Check size={16} />Approve change</button><button type="button" className="text-link" disabled={busy} onClick={() => save('reject')}>Decline request</button></div></form> : <p className="admin-hint">Your current event details remain unchanged until approval.</p>}
    </div>}
    {!!data?.items.length && <details className="event-change-history"><summary><span>Event change history</span><ChevronDown size={18} aria-hidden="true" /></summary><ol>{data.items.map(entry => <li key={entry.id}><strong>{titles[entry.action]}</strong><time dateTime={entry.at}>{new Date(entry.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</time><p className="event-change-reason">{entry.reason}</p>{entry.requestReason && <p className="admin-hint">Client request: {entry.requestReason}</p>}<Comparison before={entry.before} after={entry.after} /></li>)}</ol>{data.next !== null && <button type="button" className="text-link" disabled={busy} onClick={more}>{busy ? 'Loading…' : 'View more changes'}</button>}</details>}
    {editing && <dialog ref={dialog} className="event-edit-dialog" aria-labelledby="event-edit-title" onCancel={event => { if (busy) event.preventDefault(); else setEditing(false); }}><header><h2 id="event-edit-title">{audience === 'admin' ? 'Edit event details' : 'Request event changes'}</h2><button type="button" className="chat-icon" aria-label="Close editor" disabled={busy} onClick={() => setEditing(false)}><X size={20} /></button></header>
      <p>{audience === 'admin' ? 'Saving updates the event for both you and the client.' : 'The team will review your request before updating the event.'}</p>
      <form className="booking-form" onSubmit={event => { event.preventDefault(); save(audience === 'admin' ? 'edit' : 'request'); }}><fieldset disabled={busy}>
        <label htmlFor="change-type">Event type</label><Dropdown id="change-type" label="Event type" options={types.map(label => ({ label, value: label }))} value={draft.event.eventType} onChange={eventType => setDraft(old => ({ ...old, event: { ...old.event, eventType } }))} />
        <label htmlFor="change-city">City / location</label><SmoothField id="change-city" required maxLength={160} value={draft.event.city} onChange={event => setDraft(old => ({ ...old, event: { ...old.event, city: event.target.value } }))} />
        <label htmlFor="event-change-date">Proposed date</label><DatePicker id="event-change-date" value={draft.event.date} onChange={date => setDraft(old => ({ ...old, event: { ...old.event, date } }))} />
        <label htmlFor="change-brief">Event brief</label><SmoothField multiline id="change-brief" required maxLength={5000} value={draft.event.details} onChange={event => setDraft(old => ({ ...old, event: { ...old.event, details: event.target.value } }))} />
        <label htmlFor="change-reason">Reason for this change · shared with client and team</label><SmoothField multiline id="change-reason" required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} placeholder="Explain what needs changing and why." />
        {error && <p role="alert" className="admin-error">{error}</p>}
        <div className="event-change-actions"><button className="button button-solid">{busy ? 'Saving…' : audience === 'admin' ? 'Save event details' : 'Send change request'}</button><button className="text-link" type="button" onClick={() => setEditing(false)}>Cancel</button></div>
      </fieldset></form>
    </dialog>}
  </section>;
}
