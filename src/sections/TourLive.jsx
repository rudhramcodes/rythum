import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
export default function TourLive() {
  const [dates, setDates] = useState([]);
  const [state, setState] = useState('loading');
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api/shows`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { setDates(data.items); setState('ready'); })
      .catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, []);
  const formatDate = value => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  return <section id="tour" className="section tour-section"><div className="shell">
    <div className="section-heading"><div><p className="eyebrow">Live shows</p><h2>See you there.</h2></div><p className="section-note">Garba nights, concerts<br />and everything in between.</p></div>
    {state !== 'ready' ? <p role="status">{state === 'loading' ? 'Loading shows…' : 'Shows are temporarily unavailable. Please contact artist management.'}</p> : dates.length === 0 && <p>New show dates will be announced soon.</p>}
    <div className="tour-list">{dates.map(gig => { const past = today > gig.end; const current = today >= gig.start && !past; return <article className={`tour-row ${past ? 'tour-past' : ''}`} key={gig.id}><time dateTime={gig.start}>{formatDate(gig.start)}{gig.end !== gig.start && ` – ${formatDate(gig.end)}`} </time><div><h3>{gig.city}</h3><p>{gig.event}</p><p className="venue">{gig.venue}</p></div><span className="tour-status">{past ? 'Past show' : current ? 'Residency dates' : 'Upcoming'}</span>{!past && <a className="text-link" href={gig.url || `mailto:notyourshastri@gmail.com?subject=${encodeURIComponent('Show inquiry: ' + gig.city + ' ' + gig.start)}`}>Show details <ArrowUpRight size={17} /></a>}</article>; })}</div>
    <p className="tour-note">For venue information and ticket availability, contact <a href="mailto:notyourshastri@gmail.com">artist management</a>.</p>
  </div></section>;
}
