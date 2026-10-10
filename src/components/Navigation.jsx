import { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
const links = [['Music', '#music'], ['Live', '#tour'], ['Videos', '#videos'], ['About', '#craft'], ['Pulse Lab', '#pulse-lab']];
export default function Navigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const trigger = toggle.current;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('a')?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'Tab') {
        const nodes = [toggle.current, ...panel.current.querySelectorAll('a')];
        const first = nodes[0], last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', keydown); trigger?.focus(); };
  }, [open]);
  return <header className="site-header">
    <div className="header-inner">
      <a href="#home" className="wordmark" aria-label="Rythum Shastri home">RYTHUM SHASTRI<span className="brand-period">.</span></a>
      <nav className="desktop-nav" aria-label="Main navigation">{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <a className="header-book" href="#booking">Bookings <ArrowUpRight size={15} /></a>
      <button className="menu-toggle" ref={toggle} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav ref={panel} id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">{[...links, ['Legacy', '#legacy'], ['Bookings', '#booking']].map(([label, href]) => <a href={href} key={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={24} /></a>)}</nav>}
  </header>;
}
