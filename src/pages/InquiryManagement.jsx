import { useState } from 'react';
import { adminRequest } from './adminApi';
import Dropdown from '../components/booking/Dropdown';
import DatePicker from '../components/booking/DatePicker';
import SmoothField from '../components/booking/SmoothField';
import '../components/booking/booking.css';

const options = ['New', 'In discussion', 'Quoted', 'Confirmed', 'Closed'].map(value => ({ value, label: value }));
const labels = { status: 'Status', followUp: 'Follow-up date', closureReason: 'Closure reason' };

export default function InquiryManagement({ inquiry, onSaved, onExpired }) {
  const [status, setStatus] = useState(inquiry.status);
  const [followUp, setFollowUp] = useState(inquiry.followUp || '');
  const [closureReason, setClosureReason] = useState(inquiry.closureReason || '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
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
  return <section className="admin-management" aria-labelledby="manage-inquiry">
    <h3 id="manage-inquiry">Manage inquiry</h3>
    <p className="admin-hint">Private workspace · Notes and history are visible only to the admin team.</p>
    <form onSubmit={save} className="booking-form">
      <fieldset disabled={busy}>
        <div className="admin-management-grid">
          <div><label htmlFor="inquiry-status">Status</label><Dropdown id="inquiry-status" label="Inquiry status" value={status} options={options} onChange={setStatus} /></div>
          <div><label htmlFor="booking-date">Follow-up date</label><DatePicker value={followUp} onChange={setFollowUp} />{followUp && <button type="button" className="admin-inline-link" onClick={() => setFollowUp('')}>Clear follow-up</button>}</div>
        </div>
        {status === 'Closed' && <div className="admin-management-field"><label htmlFor="closure-reason">Reason for closing</label><SmoothField id="closure-reason" value={closureReason} onChange={event => setClosureReason(event.target.value)} required maxLength={1000} placeholder="Completed, cancelled, or another reason" /></div>}
        <div className="admin-management-field"><label htmlFor="internal-note">Add a private note</label><SmoothField multiline id="internal-note" value={note} onChange={event => setNote(event.target.value)} maxLength={3000} placeholder="Context for the team or the next follow-up…" /></div>
        {error && <p role="alert" className="admin-error">{error}</p>}
        {notice && <p role="status" className="admin-notice">{notice}</p>}
        <div className="admin-management-actions"><button className="button button-solid" disabled={busy || conflict} type="submit">{busy ? 'Saving…' : 'Save changes'}</button>{conflict && <button type="button" className="text-link" onClick={reload}>Reload latest details</button>}</div>
      </fieldset>
    </form>
    <section className="admin-history" aria-labelledby="inquiry-history"><h3 id="inquiry-history">Notes & history</h3>
      {!inquiry.history?.length ? <p className="admin-hint">Status changes, follow-ups and notes will appear here.</p> : <ol>{[...inquiry.history].reverse().map(entry => <li key={entry.id}>
        <p className="admin-history-meta"><time dateTime={entry.at}>{new Date(entry.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time> · {entry.actor}</p>
        {Object.entries(entry.changes).map(([key, change]) => <p key={key}>{labels[key]}: {change.from || 'Not set'} → {change.to || 'Cleared'}</p>)}
        {entry.note && <p className="admin-history-note">{entry.note}</p>}
      </li>)}</ol>}
    </section>
  </section>;
}
