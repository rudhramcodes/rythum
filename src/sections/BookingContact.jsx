import { useState } from 'react';
import { ArrowUpRight, Copy, Check } from 'lucide-react';
const email = 'notyourshastri@gmail.com';
export default function BookingContact() {
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  async function copyEmail() {
    try { await navigator.clipboard.writeText(email); setCopied(true); setNotice('Email address copied.'); }
    catch { setNotice('Copy is unavailable. You can select the email address above.'); }
  }
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = `Booking inquiry: ${data.get('eventType')} in ${data.get('city')}`;
    const body = `Hello Rythum & team,\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone')}\nEvent: ${data.get('eventType')}\nLocation: ${data.get('city')}\nDate: ${data.get('date')}\n\n${data.get('details')}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setNotice('Your email app will open with a draft. Please send it there to complete your inquiry.');
  }
  return <section id="booking" className="section booking-section"><div className="shell booking-layout"><div className="booking-intro"><p className="eyebrow">Bookings & collaborations</p><h2>Let’s make<br />a great night.</h2><p>For festivals, concerts, weddings, private events and studio collaborations, get in touch.</p><a className="booking-email" href={`mailto:${email}`}>{email}</a><button className="text-link" onClick={copyEmail}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy email address'}</button><a className="text-link press-link" href={`mailto:${email}?subject=Press%20kit%20and%20technical%20rider`}>Request press kit & technical rider <ArrowUpRight size={16} /></a></div><form onSubmit={submit} className="booking-form"><div className="form-grid"><label>Your name<input name="name" autoComplete="name" required placeholder="Name or organisation" /></label><label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label><label>Phone <span>(optional)</span><input name="phone" type="tel" autoComplete="tel" placeholder="Include country code" /></label><label>Event type<select name="eventType"><option>Navratri / Garba</option><option>Concert / Festival</option><option>Wedding / Sangeet</option><option>Private / Corporate event</option><option>Studio collaboration</option></select></label><label>City & country<input name="city" required placeholder="Where is the event?" /></label><label>Proposed date<input name="date" type="date" /></label></div><label>Tell us about your event<textarea name="details" rows="4" required placeholder="Venue, audience size and anything else we should know." /></label><button className="button button-solid" type="submit">Prepare email inquiry <ArrowUpRight size={17} /></button><p className="form-help">Opens a draft in your email app.</p><p role="status" className="form-notice">{notice}</p></form></div></section>;
}
