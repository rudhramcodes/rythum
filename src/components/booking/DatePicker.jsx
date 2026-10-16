import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Dropdown from './Dropdown';
import { isAvailableDate, localDate, monthDays } from './date';

const months = Array.from({ length: 12 }, (_, value) => ({ value, label: new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2024, value, 1)) }));
const formatDate = value => new Date(`${value}T12:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' });

export default function DatePicker({ value, onChange, error }) {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [view, setView] = useState(() => new Date());
  const today = localDate();
  const year = view.getFullYear();
  const month = view.getMonth();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => ({ value: currentYear + i, label: String(currentYear + i) }));
  const days = monthDays(year, month);
  const canGoBack = year > currentYear || month > new Date().getMonth();

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const returnFocus = trigger.current;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; returnFocus?.focus(); };
  }, [open]);

  function show() {
    const initial = isAvailableDate(value) ? value : today;
    setDraft(isAvailableDate(value) ? value : '');
    setView(new Date(`${initial}T12:00:00`));
    setOpen(true);
  }

  function moveDay(event, date) {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let amount = steps[event.key];
    const start = new Date(`${date}T12:00:00`);
    if (event.key === 'Home') amount = -((start.getDay() + 6) % 7);
    if (event.key === 'End') amount = 6 - ((start.getDay() + 6) % 7);
    if (amount === undefined) return;
    event.preventDefault();
    start.setDate(start.getDate() + amount);
    const next = localDate(start);
    if (!isAvailableDate(next) || start.getFullYear() > currentYear + 100) return;
    setView(new Date(start.getFullYear(), start.getMonth(), 1));
    requestAnimationFrame(() => dialog.current?.querySelector(`[data-date="${next}"]`)?.focus());
  }

  return <div className="booking-date">
    <input type="hidden" name="date" value={value} />
    <button id="booking-date" ref={trigger} className={`booking-control${value ? '' : ' is-placeholder'}`} type="button" aria-haspopup="dialog" aria-expanded={open} aria-invalid={Boolean(error)} aria-describedby={error ? 'booking-date-error' : 'booking-date-help'} onClick={show}>
      {value ? formatDate(value) : 'Choose a date'}<CalendarDays size={19} />
    </button>
    <p id="booking-date-help" className="booking-field-help">Optional · Today or a future date</p>
    {error && <p id="booking-date-error" className="booking-field-error" role="alert">{error}</p>}
    {open && <dialog ref={dialog} className="booking-date-dialog" aria-labelledby="booking-date-title" onCancel={() => setOpen(false)} onClick={event => { if (event.target === dialog.current) setOpen(false); }}>
      <div className="booking-date-panel">
        <div className="date-sheet-handle" aria-hidden="true" />
        <div className="date-picker-heading"><div><h3 id="booking-date-title">Your event date</h3><p>{draft ? formatDate(draft) : 'Find a day that works for you.'}</p></div><button type="button" className="date-icon-button" aria-label="Close date picker" onClick={() => setOpen(false)}><X size={20} /></button></div>
        <div className="date-month-controls">
          <button type="button" className="date-icon-button" disabled={!canGoBack} aria-label="Previous month" onClick={() => setView(new Date(year, month - 1, 1))}><ChevronLeft size={20} /></button>
          <Dropdown label="Month" value={month} options={months} onChange={next => setView(new Date(year, next, 1))} />
          <Dropdown label="Year" value={year} options={years} onChange={next => setView(new Date(next, month, 1))} />
          <button type="button" className="date-icon-button" disabled={year === currentYear + 100 && month === 11} aria-label="Next month" onClick={() => setView(new Date(year, month + 1, 1))}><ChevronRight size={20} /></button>
        </div>
        <div className="date-calendar" role="group" aria-label={`${months[month].label} ${year}`}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span className="date-weekday" key={index} aria-hidden="true">{day}</span>)}
          {days.map((date, index) => date ? <button type="button" key={date} data-date={date} className={`date-day${draft === date ? ' is-selected' : ''}${today === date ? ' is-today' : ''}`} disabled={!isAvailableDate(date, today)} aria-label={formatDate(date)} aria-pressed={draft === date} aria-current={today === date ? 'date' : undefined} onKeyDown={event => moveDay(event, date)} onClick={() => setDraft(date)}>{Number(date.slice(-2))}</button> : <span key={`blank-${index}`} />)}
        </div>
        <div className="date-shortcuts"><button type="button" onClick={() => { setDraft(today); setView(new Date()); }}>Today</button><button type="button" onClick={() => { onChange(''); setOpen(false); }}>Clear date</button></div>
        <button type="button" className="button button-solid date-done" disabled={!isAvailableDate(draft, today)} onClick={() => { if (isAvailableDate(draft)) { onChange(draft); setOpen(false); } }}>Done</button>
      </div>
    </dialog>}
  </div>;
}
