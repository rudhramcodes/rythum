import { useEffect, useRef, useState } from 'react';
import { Check, Copy, ArrowUpRight } from 'lucide-react';

export default function BookingConfirmation({ receipt, onNewInquiry }) {
  const heading = useRef(null);
  const reference = useRef(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');
  const date = receipt.event.date
    ? new Date(`${receipt.event.date}T12:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'To be decided';

  useEffect(() => { heading.current?.focus(); }, []);

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(receipt.reference);
      setCopied(true);
      setNotice('Reference copied.');
    } catch {
      reference.current?.focus();
      reference.current?.select();
      setNotice('Select and copy your reference using your device’s copy command.');
    }
  }

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
      <textarea ref={reference} id="booking-reference" value={receipt.reference} rows={2} readOnly spellCheck={false} aria-describedby="booking-reference-help" />
      <p id="booking-reference-help">Keep this handy when you contact us.</p>
    </div>
    <div className="booking-confirmation-actions">
      <button type="button" className="button button-solid" onClick={copyReference}>{copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}{copied ? 'Reference copied' : 'Copy reference'}</button>
      <button type="button" className="text-link" onClick={onNewInquiry}>Send another inquiry <ArrowUpRight size={17} aria-hidden="true" /></button>
    </div>
    <p className="booking-copy-notice" role="status">{notice}</p>
    <p className="booking-confirmation-note">Your booking is not confirmed yet. Dates and availability will be agreed with you.</p>
  </section>;
}
