import { useEffect, useState } from 'react';
import { ChevronDown, ArrowRight, LockKeyhole, CalendarDays } from 'lucide-react';
import { adminRequest } from './adminApi';
import Dropdown from '../components/booking/Dropdown';
import { localDate } from '../components/booking/date';
import DatePicker from '../components/booking/DatePicker';
import SmoothField from '../components/booking/SmoothField';
import '../components/booking/booking.css';

const options = ['New', 'In discussion', 'Quoted', 'Confirmed', 'Closed'].map(value => ({ value, label: value }));
const statusHelp = {
  New: 'New inquiry — review the event and contact the client.',
  'In discussion': 'Discussing requirements, availability and next steps.',
  Quoted: 'Pricing shared — waiting for the client’s decision.',
  Confirmed: 'Booking agreed with the client.',
  Closed: 'Completed, cancelled or no longer proceeding.',
};

export default function InquiryManagement({ inquiry, onSaved, onExpired }) {
  const [status, setStatus] = useState(inquiry.status);
  const [followUp, setFollowUp] = useState(inquiry.followUp || '');
  const [closureReason, setClosureReason] = useState(inquiry.closureReason || '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  const [history, setHistory] = useState({ items: [], next: null, total: 0 });
  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyError, setHistoryError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    adminRequest(`admin/inquiries/${inquiry.reference}/history`, { signal: controller.signal })
      .then(data => { setHistory(data); setHistoryError(''); })
      .catch(error => { if (!controller.signal.aborted) { if (error.status === 401) onExpired(); else setHistoryError(error.message); } });
    return () => controller.abort();
  }, [inquiry.reference, inquiry.revision, onExpired]);
  async function moreHistory() {
    if (historyBusy) return;
    setHistoryBusy(true); setHistoryError('');
    try {
      const data = await adminRequest(`admin/inquiries/${inquiry.reference}/history${historyError ? '' : `?before=${history.next}`}`);
      setHistory(previous => ({ ...data, items: historyError ? data.items : [...previous.items, ...data.items.filter(item => !previous.items.some(existing => existing.id === item.id))] }));
    } catch (error) { if (error.status === 401) onExpired(); else setHistoryError(error.message); }
    finally { setHistoryBusy(false); }
  }
  async function save(event) {
    event.preventDefault();
    if (busy || conflict) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await adminRequest(`admin/inquiries/${inquiry.reference}`, { method: 'POST', body: JSON.stringify({ revision: inquiry.revision || 0, status, followUp, closureReason, note }) });
      onSaved(result.inquiry); setNote(''); setNotice('Changes saved. No customer notification was sent.');
    } catch (error) {
      if (error.status === 401) onExpired();
      else { setError(error.message); setConflict(error.status === 409); }
    } finally { setBusy(false); }
  }
  async function reload() {
    setBusy(true); setError('');
    try {
      const result = await adminRequest(`admin/inquiries/${inquiry.reference}`);
      onSaved(result.inquiry); setStatus(result.inquiry.status); setFollowUp(result.inquiry.followUp || ''); setClosureReason(result.inquiry.closureReason || '');
      setConflict(false); setNotice('Latest details loaded. Your unsaved note is preserved; review the status and date before saving.');
    } catch (error) { if (error.status === 401) onExpired(); else setError(error.message); }
    finally { setBusy(false); }
  }
  const followUpLabel = inquiry.followUp ? new Date(`${inquiry.followUp}T12:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  return <><details className="admin-management admin-detail-disclosure">
    <summary><span>Manage inquiry<small>Status, follow-up and private team notes</small></span><ChevronDown size={20} aria-hidden="true" /></summary><div className="admin-disclosure-content">
    <p className="admin-hint">Status is visible to the client. Follow-ups and notes are private to your team.</p>
    {followUpLabel && <p className="admin-followup-summary"><CalendarDays size={17} aria-hidden="true" /><span>Next follow-up: <strong>{followUpLabel}</strong>{inquiry.status !== 'Closed' && <span className="admin-status">{inquiry.followUp < localDate() ? 'Overdue' : inquiry.followUp === localDate() ? 'Today' : 'Upcoming'}</span>}</span></p>}
    <form onSubmit={save} className="booking-form">
      <fieldset disabled={busy}>
        <div className="admin-management-grid">
          <div><label htmlFor="inquiry-status">Status</label><Dropdown id="inquiry-status" label="Inquiry status" value={status} options={options} onChange={setStatus} /><p className="admin-hint">{statusHelp[status]}</p></div>
          <div><label htmlFor="booking-date">Next follow-up with client</label><p className="admin-hint">When your team should contact the client again. This does not change the event date or send an automatic reminder.</p><DatePicker title="Next follow-up" value={followUp} onChange={setFollowUp} />{followUp && <button type="button" className="admin-inline-link" onClick={() => setFollowUp('')}>Clear follow-up</button>}</div>
        </div>
        {status === 'Closed' && <div className="admin-management-field"><label htmlFor="closure-reason">Reason for closing</label><SmoothField id="closure-reason" value={closureReason} onChange={event => setClosureReason(event.target.value)} required maxLength={1000} placeholder="Completed, cancelled, or another reason" /></div>}
        <div className="admin-management-field"><label htmlFor="internal-note">Add a private note</label><SmoothField multiline id="internal-note" value={note} onChange={event => setNote(event.target.value)} maxLength={3000} placeholder="What was discussed? What should the team do next?" /></div>
        {error && <p role="alert" className="admin-error">{error}</p>}
        {notice && <p role="status" className="admin-notice">{notice}</p>}
        <div className="admin-management-actions"><button className="button button-solid" disabled={busy || conflict} type="submit">{busy ? 'Saving…' : 'Save changes'}</button>{conflict && <button type="button" className="text-link" onClick={reload}>Reload latest details</button>}</div>
      </fieldset>
    </form>
  </div></details>
    <section className="admin-history admin-detail-disclosure" aria-labelledby="notes-history-title">
      <div className="admin-disclosure-content"><h3 id="notes-history-title">Status & private notes</h3><p className="admin-hint">Team only · Latest first</p>
      {historyError && <p role="alert" className="admin-error">{historyError}</p>}
      {!history.items.length ? <p className="admin-hint">Status updates and private notes will appear here.</p> : <ol>{history.items.map(entry => <li key={entry.id}>
        <p className="admin-history-meta"><time dateTime={entry.at}>{new Date(entry.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</time> · {entry.actor}</p>
        {entry.changes?.status && <p className="admin-history-status"><span>Status</span><span className="admin-status">{entry.changes.status.from || 'New'}</span><ArrowRight size={15} aria-label="changed to" /><span className="admin-status">{entry.changes.status.to}</span></p>}
        {entry.note && <div className="admin-private-note"><span className="admin-note-label"><LockKeyhole size={14} aria-hidden="true" />Private note</span><p className="admin-history-note">{entry.note}</p></div>}
      </li>)}</ol>}
      {(history.next !== null || historyError) && <button type="button" className="text-link" disabled={historyBusy} onClick={moreHistory}>{historyBusy ? 'Loading…' : historyError ? 'Retry history' : 'View 5 more'}<ChevronDown size={16} /></button>}
      {history.items.length > 0 && <p className="admin-hint">Showing {history.items.length} of {history.total}</p>}
      </div>
    </section></>;
}
