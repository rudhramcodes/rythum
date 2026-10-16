import { useState, useRef } from 'react';
import { ArrowUpRight, Copy, Check } from 'lucide-react';
import Dropdown from '../components/booking/Dropdown';
import DatePicker from '../components/booking/DatePicker';
import SmoothField from '../components/booking/SmoothField';
import { isAvailableDate } from '../components/booking/date';
import { submitInquiry } from '../components/booking/submitInquiry';
import BookingConfirmation from '../components/booking/BookingConfirmation';
import '../components/booking/booking.css';

const eventOptions = ['Navratri / Garba', 'Concert / Festival', 'Wedding / Sangeet', 'Private / Corporate event', 'Studio collaboration'].map(value => ({ value, label: value }));
const email = 'notyourshastri@gmail.com';
export default function BookingContact() {
  const [eventType, setEventType] = useState(eventOptions[0].value);
  const [date, setDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [submissionError, setSubmissionError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [duplicateInquiry, setDuplicateInquiry] = useState(null);
  const attempt = useRef(null);
  const inFlight = useRef(false);

  function clearFieldError(name) {
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (name === 'email' && duplicateInquiry) setDuplicateInquiry(null);
    if (submissionError) setSubmissionError('');
  }

  async function copyEmail() {
    try { await navigator.clipboard.writeText(email); setCopied(true); setNotice('Email address copied.'); }
    catch { setNotice('Copy is unavailable. You can select the email address above.'); }
  }

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current || receipt) return;
    const form = event.currentTarget;

    const errors = {};
    const nameVal = form.elements.namedItem('name')?.value?.trim();
    if (!nameVal) errors.name = 'Please enter your name or organisation.';

    const emailVal = form.elements.namedItem('email')?.value?.trim();
    if (!emailVal) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    const cityVal = form.elements.namedItem('city')?.value?.trim();
    if (!cityVal) errors.city = 'Please enter the event city and country.';

    const detailsVal = form.elements.namedItem('details')?.value?.trim();
    if (!detailsVal) errors.details = 'Please share some details about your event.';

    if (date && !isAvailableDate(date)) {
      errors.date = 'Please choose today or a future date.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmissionError('Please correct the highlighted fields.');
      const firstInvalid = ['name', 'email', 'phone', 'city', 'date', 'details'].find(k => errors[k]);
      if (firstInvalid) document.getElementById(`booking-${firstInvalid}`)?.focus();
      return;
    }

    const data = new FormData(form);
    const payload = Object.fromEntries(['name', 'email', 'phone', 'eventType', 'city', 'date', 'details', 'website'].map(name => [name, String(data.get(name) || '').trim()]));
    payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const snapshot = JSON.stringify(payload);
    if (attempt.current?.snapshot !== snapshot) attempt.current = { snapshot, key: crypto.randomUUID() };
    inFlight.current = true;
    setSending(true);
    setSubmissionError('');
    setDuplicateInquiry(null);
    setFieldErrors({});
    setNotice('');
    try {
      const saved = await submitInquiry(payload, attempt.current.key);
      setReceipt({ ...saved, event: { eventType: payload.eventType, city: payload.city, date: payload.date } });
    } catch (error) {
      if (error.code === 'DUPLICATE_INQUIRY') {
        setDuplicateInquiry({
          message: error.message,
          reference: error.reference,
        });
        setFieldErrors(prev => ({ ...prev, ...(error.fields || { email: 'An inquiry with this email address is already awaiting review.' }) }));
        setSubmissionError('');
      } else {
        setSubmissionError(error.message || 'Please check the highlighted fields.');
        if (error.fields) setFieldErrors(error.fields);
        if (error.fields?.date) setDateError(error.fields.date);
      }
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  function startNewInquiry() {
    setReceipt(null);
    setDate('');
    setDateError('');
    setEventType(eventOptions[0].value);
    setSubmissionError('');
    setFieldErrors({});
    setDuplicateInquiry(null);
    attempt.current = null;
    requestAnimationFrame(() => document.getElementById('booking-name')?.focus());
  }

  return <section id="booking" className="section booking-section"><div className="shell booking-layout"><div className="booking-intro"><p className="eyebrow">Bookings & collaborations</p><h2>Let’s make<br />a great night.</h2><p>For festivals, concerts, weddings, private events and studio collaborations, get in touch.</p><a className="booking-email" href={`mailto:${email}`}>{email}</a><button className="text-link" onClick={copyEmail}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy email address'}</button><span role="status" className="booking-email-notice">{notice}</span><a className="text-link press-link" href={`mailto:${email}?subject=Press%20kit%20and%20technical%20rider`}>Request press kit & technical rider <ArrowUpRight size={16} /></a></div>{receipt ? <BookingConfirmation receipt={receipt} onNewInquiry={startNewInquiry} /> : <form onSubmit={submit} className="booking-form" noValidate>
    <fieldset className="booking-form-fields" disabled={sending} aria-busy={sending}>
      <div className="booking-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="form-grid">
        <label htmlFor="booking-name">Your name<SmoothField id="booking-name" name="name" autoComplete="name" required maxLength={120} placeholder="Name or organisation" error={fieldErrors.name} onChange={() => clearFieldError('name')} /></label>
        <label htmlFor="booking-email">Email address<SmoothField id="booking-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" error={fieldErrors.email} onChange={() => clearFieldError('email')} /></label>
        <label htmlFor="booking-phone">Phone <span>(optional)</span><SmoothField id="booking-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="Include country code" error={fieldErrors.phone} onChange={() => clearFieldError('phone')} /></label>
        <div className="booking-field"><label htmlFor="booking-event">Event type</label><Dropdown id="booking-event" label="Event type" name="eventType" value={eventType} options={eventOptions} onChange={setEventType} /></div>
        <label htmlFor="booking-city">City & country<SmoothField id="booking-city" name="city" required maxLength={160} placeholder="Where is the event?" error={fieldErrors.city} onChange={() => clearFieldError('city')} /></label>
        <div className="booking-field"><label htmlFor="booking-date">Proposed date</label><DatePicker value={date} error={fieldErrors.date || dateError} onChange={value => { setDate(value); setDateError(''); clearFieldError('date'); }} /></div>
      </div>
      <label htmlFor="booking-details">Tell us about your event<SmoothField multiline id="booking-details" name="details" rows="4" required maxLength={5000} placeholder="Venue, audience size and anything else we should know." error={fieldErrors.details} onChange={() => clearFieldError('details')} /></label>
      <button className="button button-solid" type="submit">{sending ? 'Submitting…' : 'Send inquiry'} <ArrowUpRight size={17} /></button>
    </fieldset>
    <p className="form-help">An inquiry is not a confirmed booking. Our team will review your event details.</p>
    {duplicateInquiry && (
      <div className="booking-duplicate-banner" role="alert">
        <h4>Inquiry already received</h4>
        <p>{duplicateInquiry.message}</p>
        {duplicateInquiry.reference && (
          <div className="booking-duplicate-ref">
            <span>Your reference:</span> <code>{duplicateInquiry.reference}</code>
          </div>
        )}
      </div>
    )}
    {submissionError && <p role="alert" className="booking-submit-error">{submissionError}</p>}
    <span role="status" className="booking-submit-status">{sending ? 'Submitting your inquiry…' : ''}</span>
  </form>}</div></section>;
}
