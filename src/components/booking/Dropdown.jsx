import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function Dropdown({ id, label, value, options, onChange, name }) {
  const listId = useId();
  const root = useRef(null);
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = Math.max(0, options.findIndex(option => option.value === value));

  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => {
    if (open) root.current.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function show(index = selected) { setActive(index); setOpen(true); }
  function choose(index) { onChange(options[index].value); setOpen(false); trigger.current.focus(); }
  function keydown(event) {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Escape') { setOpen(false); return; }
      if (event.key === 'Enter' || event.key === ' ') { if (open) choose(active); else show(); return; }
      if (!open) { show(); return; }
      setActive(index => event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      const match = options.findIndex((option, index) => index > active && option.label.toLowerCase().startsWith(event.key.toLowerCase()));
      const index = match < 0 ? options.findIndex(option => option.label.toLowerCase().startsWith(event.key.toLowerCase())) : match;
      if (index >= 0) { event.preventDefault(); show(index); }
    }
  }

  return <div className="booking-dropdown" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    {name && <input type="hidden" name={name} value={value} />}
    <button id={id} ref={trigger} type="button" className="booking-control" role="combobox" aria-label={label} aria-expanded={open} aria-controls={listId} aria-haspopup="listbox" aria-activedescendant={open ? `${listId}-${active}` : undefined} onKeyDown={keydown} onClick={() => open ? setOpen(false) : show()}>
      {options[selected]?.label}<ChevronDown size={18} className={open ? 'dropdown-chevron is-open' : 'dropdown-chevron'} />
    </button>
    {open && <div id={listId} role="listbox" aria-label={label} className="booking-options" data-lenis-prevent>
      {options.map((option, index) => <div key={option.value} id={`${listId}-${index}`} role="option" aria-selected={value === option.value} data-active={active === index} onPointerMove={() => setActive(index)} onPointerDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span>{option.label}</span>{value === option.value && <Check size={17} />}
      </div>)}
    </div>}
  </div>;
}
