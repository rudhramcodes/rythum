import { useEffect, useState } from 'react';
import DatePicker from '../components/booking/DatePicker';
import '../components/booking/booking.css';
import { adminRequest } from './adminApi';

const placeholders = { city: 'e.g. Houston, TX', event: 'e.g. Navratri Live Concert', venue: 'e.g. VPSS Cultural Center Hall', url: 'https://example.com/tickets' };
const empty = { start: '', end: '', city: '', event: '', venue: '', url: '' };
export default function Shows({ onExpired }) {
  const [items, setItems] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fail = error => { if (error.status === 401) onExpired(); else setError(error.message); };
  useEffect(() => {
    const controller = new AbortController();
    adminRequest('admin/shows', { signal: controller.signal }).then(data => setItems(data.items)).catch(error => {
      if (!controller.signal.aborted) { if (error.status === 401) onExpired(); else setError(error.message); }
    });
    return () => controller.abort();
  }, [onExpired]);
  async function save(event) {
    event.preventDefault();
    if (!draft.start || !draft.end) { setError('Choose a start and end date.'); return; }
    if (draft.end < draft.start) { setError('End date must be on or after the start date.'); return; }
    setBusy(true); setError(''); setNotice('');
    const { id, ...body } = draft;
    try {
      const { show } = await adminRequest(`admin/shows${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      setItems(current => [...current.filter(item => item.id !== show.id), show].sort((a, b) => a.start.localeCompare(b.start)));
      setDraft(null); setNotice('Show saved. The website will display the update on its next load.');
    } catch (error) { fail(error); } finally { setBusy(false); }
  }
  async function remove(show) {
    if (!window.confirm(`Delete “${show.event}” in ${show.city}? This removes it from the website.`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await adminRequest(`admin/shows/${encodeURIComponent(show.id)}`, { method: 'DELETE' });
      setItems(current => current.filter(item => item.id !== show.id));
      setNotice('Show deleted.');
    } catch (error) { fail(error); } finally { setBusy(false); }
  }
  return <section className="admin-shows">
    <div className="shows-heading"><div><p className="eyebrow">Website content</p><h1>Shows</h1><p>Manage the dates displayed in “See you there.”</p></div><button className="button button-solid" disabled={!items || busy || !!draft} onClick={() => { setDraft({ ...empty }); setError(''); setNotice(''); }}>Add show</button></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {draft && <form className="shows-editor" onSubmit={save}>
      <h2>{draft.id ? 'Edit show' : 'Add show'}</h2>
      <fieldset disabled={busy}><div className="shows-fields">
        <div><label htmlFor="show-start">Start date</label><DatePicker id="show-start" title="Show start date" value={draft.start} minDate="1900-01-01" help="Required · Past or upcoming show" onChange={start => setDraft(current => ({ ...current, start }))} /></div>
        <div><label htmlFor="show-end">End date</label><DatePicker id="show-end" title="Show end date" value={draft.end} minDate={draft.start || '1900-01-01'} help="Required · On or after the start date" onChange={end => setDraft(current => ({ ...current, end }))} /></div>
        {Object.entries({ city: 'City / location', event: 'Event name', venue: 'Venue', url: 'Show details / ticket URL (optional)' }).map(([key, label]) => <label key={key}>{label}<input placeholder={placeholders[key]} required={key !== 'url'} type={key === 'url' ? 'url' : 'text'} maxLength={key === 'city' ? 160 : key === 'event' || key === 'venue' ? 200 : undefined} value={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} /></label>)}
      </div><p>Dates control the past / upcoming status. Leave the URL blank to use the artist-management email link.</p><div className="shows-actions"><button className="button button-solid" type="submit">{busy ? 'Saving…' : 'Save show'}</button><button type="button" className="button shows-cancel" onClick={() => setDraft(null)}>Cancel</button></div></fieldset>
    </form>}
    {!items && !error && <p role="status">Loading shows…</p>}
    {items?.length === 0 && <p>No shows yet. Add a show to publish it on the website.</p>}
    <div>{items?.map(show => <article className="shows-row" key={show.id}><div><h2>{show.event}</h2><p>{show.city} · {show.venue}</p><p>{show.start}{show.end !== show.start && ` – ${show.end}`}</p></div><div className="shows-actions"><button className="text-link" disabled={busy || !!draft} onClick={() => { const { id, start, end, city, event, venue, url } = show; setDraft({ id, start, end, city, event, venue, url }); setError(''); setNotice(''); }}>Edit</button><button className="text-link" disabled={busy || !!draft} onClick={() => remove(show)}>Delete</button></div></article>)}</div>
  </section>;
}
