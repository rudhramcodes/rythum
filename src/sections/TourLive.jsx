import { ArrowUpRight } from 'lucide-react';
const dates = [
  { start: '2026-10-02', end: '2026-10-03', date: '02–03 Oct', city: 'Longview, TX', event: 'Fall Headline Festival', venue: 'Maude Cobb Convention Center' },
  { start: '2026-10-09', end: '2026-10-19', date: '09–19 Oct', city: 'Houston, TX', event: 'Navratri Residency', venue: 'VPSS Cultural Center Hall' },
  { start: '2026-10-22', end: '2026-10-23', date: '22–23 Oct', city: 'El Paso, TX', event: 'Southwest Navratri Celebration', venue: 'El Paso Coliseum Pavilion' },
  { start: '2026-11-07', end: '2026-11-07', date: '07 Nov', city: 'Nashville, TN', event: 'Music City Heritage Concert', venue: 'Grand Cultural Auditorium' },
  { start: '2026-11-14', end: '2026-11-14', date: '14 Nov', city: 'Longview, TX', event: 'Season Finale & Devotional Gala', venue: 'Belcher Center Stage' },
];
export default function TourLive() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  return <section id="tour" className="section tour-section"><div className="shell">
    <div className="section-heading"><div><p className="eyebrow">Live · 2026</p><h2>See you there.</h2></div><p className="section-note">Garba nights, concerts<br />and everything in between.</p></div>
    <div className="tour-list">{dates.map(gig => { const past = today > gig.end; const current = today >= gig.start && !past; return <article className={`tour-row ${past ? 'tour-past' : ''}`} key={gig.start}><time dateTime={gig.start}>{gig.date}</time><div><h3>{gig.city}</h3><p>{gig.event}</p><p className="venue">{gig.venue}</p></div><span className="tour-status">{past ? 'Past show' : current ? 'Residency dates' : 'Upcoming'}</span>{!past && <a className="text-link" href={`mailto:notyourshastri@gmail.com?subject=${encodeURIComponent('Show inquiry: ' + gig.city + ' ' + gig.date)}`}>Show details <ArrowUpRight size={17} /></a>}</article>; })}</div>
    <p className="tour-note">For venue information and ticket availability, contact <a href="mailto:notyourshastri@gmail.com">artist management</a>.</p>
  </div></section>;
}
