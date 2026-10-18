import { useEffect, useRef } from 'react';
import { Check, ArrowUpRight } from 'lucide-react';
import CopyPill from '../CopyPill';

export default function BookingConfirmation({ receipt, onNewInquiry }) {
  const heading = useRef(null);
  const date = receipt.event.date
    ? new Date(`${receipt.event.date}T12:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'To be decided';

  useEffect(() => { heading.current?.focus(); }, []);

  return <section className="booking-confirmation" aria-labelledby="booking-received-title">
    <div className="booking-confirmation-heading">
      <Check size={28} strokeWidth={1.8} aria-hidden="true" />
      <h3 id="booking-received-title" ref={heading} tabIndex={-1}>Inquiry received.</h3>
    </div>
    <p className="booking-confirmation-intro">Your event details are saved. Our team will review your inquiry.</p>
    <dl className="booking-confirmation-details">
      <div><dt>Event</dt><dd>{receipt.event.eventType}</dd></div>
      <div><dt>Location</dt><dd>{receipt.event.city}</dd></div>
      <div><dt>Proposed date</dt><dd>{date}</dd></div>
      <div><dt>Status</dt><dd>Awaiting review</dd></div>
    </dl>
    <div className="booking-reference">
      <label htmlFor="booking-reference">Your inquiry reference</label>
      <div style={{ marginBlock: '12px 8px' }}>
        <CopyPill text={receipt.reference} fullWidth label="Reference ID" monospace />
      </div>
      <p id="booking-reference-help">Keep this handy when you contact us.</p>
    </div>
    <div className="booking-confirmation-actions">
      <button type="button" className="text-link" onClick={onNewInquiry}>Send another inquiry <ArrowUpRight size={17} aria-hidden="true" /></button>
    </div>
    <p className="booking-confirmation-note">Your booking is not confirmed yet. Dates and availability will be agreed with you.</p>
  </section>;
}

