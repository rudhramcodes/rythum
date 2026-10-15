import { useEffect, useState } from 'react';
import PressGrid from '../components/PressGrid';
import { filterPress, pressFilters } from '../data/press';

export default function Press() {
  const [filter, setFilter] = useState('All');
  const items = filterPress(filter);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Press | Rythum Shastri';
    return () => { document.title = previousTitle; };
  }, []);

  return <div className="shell press-page">
    <a href="/" className="text-link press-back">← Back to Home</a>
    <h1 className="press-title">Press</h1>
    <p className="press-intro">Features, interviews and concert coverage.</p>
    <div className="press-filters" role="group" aria-label="Filter press by type">
      {pressFilters.map(label => <button type="button" key={label} aria-pressed={filter === label} aria-controls="press-results" onClick={() => setFilter(label)}>{label}</button>)}
    </div>
    <p className="press-results-count" role="status" aria-live="polite" aria-atomic="true">{items.length} {items.length === 1 ? 'item' : 'items'} · {filter} · Newest first</p>
    <div id="press-results"><PressGrid items={items} /></div>
  </div>;
}
