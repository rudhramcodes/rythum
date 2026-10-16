import { useState } from 'react';
import { ArrowUpRight, Copy, Check } from 'lucide-react';
import Dropdown from '../components/booking/Dropdown';
import DatePicker from '../components/booking/DatePicker';
import SmoothField from '../components/booking/SmoothField';
import { isAvailableDate } from '../components/booking/date';
import '../components/booking/booking.css';

const eventOptions = ['Navratri / Garba', 'Concert / Festival', 'Wedding / Sangeet', 'Private / Corporate event', 'Studio collaboration'].map(value => ({ value, label: value }));
const email = 'notyourshastri@gmail.com';
export default function BookingContact() {
  const [eventType, setEventType] = useState(eventOptions[0].value);
  const [date, setDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  async function copyEmail() {
    try { await navigator.clipboard.writeText(email); setCopied(true); setNotice('Email address copied.'); }
    catch { setNotice('Copy is unavailable. You can select the email address above.'); }
  }
  function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    for (const name of ['name', 'city', 'details']) {
      const input = form.elements.namedItem(name);
      input.setCustomValidity(input.value.trim() ? '' : 'Please fill out this field.');
    }
    if (!form.reportValidity()) return;
    if (date && !isAvailableDate(date)) {
      setDateError('Please choose today or a future date.');
      document.getElementById('booking-date').focus();
      return;
    }
    const data = new FormData(form);
    const subject = `Booking inquiry: ${data.get('eventType')} in ${data.get('city')}`;
    const body = `Hello Rythum & team,\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone')}\nEvent: ${data.get('eventType')}\nLocation: ${data.get('city')}\nDate: ${data.get('date')}\n\n${data.get('details')}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setNotice('Your email app will open with a draft. Please send it there to complete your inquiry.');
  }
  return <section id="booking" className="section booking-section"><div className="shell booking-layout"><div className="booking-intro"><p className="eyebrow">Bookings & collaborations</p><h2>Let’s make<br />a great night.</h2><p>For festivals, concerts, weddings, private events and studio collaborations, get in touch.</p><a className="booking-email" href={`mailto:${email}`}>{email}</a><button className="text-link" onClick={copyEmail}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy email address'}</button><a className="text-link press-link" href={`mailto:${email}?subject=Press%20kit%20and%20technical%20rider`}>Request press kit & technical rider <ArrowUpRight size={16} /></a></div><form onSubmit={submit} className="booking-form" onInput={event => event.target.setCustomValidity?.('')}>
    <div className="form-grid">
      <label htmlFor="booking-name">Your name<SmoothField id="booking-name" name="name" autoComplete="name" required placeholder="Name or organisation" /></label>
      <label htmlFor="booking-email">Email address<SmoothField id="booking-email" name="email" type="email" inputMode="email" autoComplete="email" required placeholder="you@example.com" /></label>
      <label htmlFor="booking-phone">Phone <span>(optional)</span><SmoothField id="booking-phone" name="phone" type="tel" autoComplete="tel" placeholder="Include country code" /></label>
      <div className="booking-field"><label htmlFor="booking-event">Event type</label><Dropdown id="booking-event" label="Event type" name="eventType" value={eventType} options={eventOptions} onChange={setEventType} /></div>
      <label htmlFor="booking-city">City & country<SmoothField id="booking-city" name="city" required placeholder="Where is the event?" /></label>
      <div className="booking-field"><label htmlFor="booking-date">Proposed date</label><DatePicker value={date} error={dateError} onChange={value => { setDate(value); setDateError(''); }} /></div>
    </div>
    <label htmlFor="booking-details">Tell us about your event<SmoothField multiline id="booking-details" name="details" rows="4" required placeholder="Venue, audience size and anything else we should know." /></label>
    <button className="button button-solid" type="submit">Prepare email inquiry <ArrowUpRight size={17} /></button>
    <p className="form-help">Opens a draft in your email app.</p><p role="status" className="form-notice">{notice}</p>
  </form></div></section>;
}
