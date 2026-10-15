import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PressGrid from '../components/PressGrid';
import { filterPress, pressFilters } from '../data/press';

export default function Press() {
  const [filter, setFilter] = useState('All');
  const items = filterPress(filter);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Press | Rythum Shastri';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -220 : 220;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleSelectFilter = (label, e) => {
    setFilter(label);
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  return (
    <div className="shell press-page">
      <a href="/" className="text-link press-back">← Back to Home</a>
      <h1 className="press-title">Press</h1>
      <p className="press-intro">Features, interviews and concert coverage.</p>

      <div className="press-filters-wrapper">
        <div className={`press-filters-fade-left${canScrollLeft ? ' is-visible' : ''}`} aria-hidden="true" />
        <button
          type="button"
          className={`press-filters-arrow press-filters-arrow-left${canScrollLeft ? ' is-visible' : ''}`}
          onClick={() => handleScroll('left')}
          aria-label="Scroll filters left"
          tabIndex={canScrollLeft ? 0 : -1}
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={scrollRef}
          className="press-filters-scroll"
          role="region"
          aria-label="Press categories slider"
        >
          <div className="press-filters" role="group" aria-label="Filter press by type">
            {pressFilters.map(label => (
              <button
                type="button"
                key={label}
                aria-pressed={filter === label}
                aria-controls="press-results"
                onClick={(e) => handleSelectFilter(label, e)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`press-filters-arrow press-filters-arrow-right${canScrollRight ? ' is-visible' : ''}`}
          onClick={() => handleScroll('right')}
          aria-label="Scroll filters right"
          tabIndex={canScrollRight ? 0 : -1}
        >
          <ChevronRight size={18} />
        </button>
        <div className={`press-filters-fade-right${canScrollRight ? ' is-visible' : ''}`} aria-hidden="true" />
      </div>

      <p className="press-results-count" role="status" aria-live="polite" aria-atomic="true">
        {items.length} {items.length === 1 ? 'item' : 'items'} · {filter} · Newest first
      </p>
      <div id="press-results">
        <PressGrid items={items} />
      </div>
    </div>
  );
}

