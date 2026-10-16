import { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { updateNavScroll } from './navScroll.js';
const links = [['Music', '#music'], ['Live', '#tour'], ['Videos', '#videos'], ['About', '#craft'], ['Pulse Lab', '#pulse-lab'], ['Press', '/press']];
export default function Navigation({ homePrefix = '' }) {
  const destination = href => href.startsWith('#') ? homePrefix + href : href;
  const [open, setOpen] = useState(false);
  const [scroll, setScroll] = useState({ hidden: false, scrolled: false });
  const header = useRef(null);
  const toggle = useRef(null);
  const panel = useRef(null);
  useEffect(() => {
    let state = { anchor: window.scrollY, hidden: false, scrolled: false };
    const onScroll = () => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      state = updateNavScroll(state, window.scrollY, max, header.current?.offsetHeight ?? 82);
      setScroll(previous => previous.hidden === state.hidden && previous.scrolled === state.scrolled
        ? previous : { hidden: state.hidden, scrolled: state.scrolled });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
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
  return <header ref={header} className={`site-header${scroll.scrolled ? ' is-scrolled' : ''}${scroll.hidden && !open ? ' is-hidden' : ''}`}>
    <div className="header-inner">
      <a href={destination('#home')} className="wordmark" aria-label="Rythum Shastri home">RYTHUM SHASTRI<span className="brand-period">.</span></a>
      <nav className="desktop-nav" aria-label="Main navigation">{links.map(([label, href]) => <a key={href} href={destination(href)} aria-current={href === '/press' && homePrefix ? 'page' : undefined}>{label}</a>)}</nav>
      <a className="header-book" href={destination('#booking')}>Bookings <ArrowUpRight size={15} /></a>
      <button className="menu-toggle" ref={toggle} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav ref={panel} id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">{[...links, ['Legacy', '#legacy'], ['Bookings', '#booking']].map(([label, href]) => <a href={destination(href)} key={href} aria-current={href === '/press' && homePrefix ? 'page' : undefined} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={24} /></a>)}</nav>}
  </header>;
}
