import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './press.css';

gsap.registerPlugin(ScrollTrigger);

function ChitralekhaFigure({ item, onOpenModal }) {
  const [activeTab, setActiveTab] = useState('clipping');
  const [isFading, setIsFading] = useState(false);
  const currentImg = activeTab === 'clipping' ? item.image : (item.coverImage || item.image);

  const handleTabSwitch = (tab) => {
    if (tab === activeTab) return;
    setIsFading(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsFading(false);
    }, 140);
  };

  return (
    <figure className="press-clipping">
      <div className="press-clipping-actions">
        <div className="press-clipping-switch" role="tablist" aria-label="Chitralekha views">
          <span
            className="press-switch-indicator"
            style={{
              transform: activeTab === 'clipping' ? 'translateX(0%)' : 'translateX(100%)',
            }}
            aria-hidden="true"
          />
          <button
            type="button"
            className={`press-switch-btn ${activeTab === 'clipping' ? 'is-active' : ''}`}
            onClick={() => handleTabSwitch('clipping')}
          >
            Article Clipping
          </button>
          {item.coverImage && (
            <button
              type="button"
              className={`press-switch-btn ${activeTab === 'cover' ? 'is-active' : ''}`}
              onClick={() => handleTabSwitch('cover')}
            >
              Magazine Cover
            </button>
          )}
        </div>
        <button
          type="button"
          className="press-zoom-btn"
          onClick={() => onOpenModal && onOpenModal(currentImg, activeTab === 'clipping' ? 'Chitralekha Feature Clipping · Page 38: "અમેરિકામાં રાસ-ગરબાની અલગ રિધમ..."' : 'Chitralekha Gujarati · Navratri 2025 Special Issue Cover')}
          title="View High Resolution Scan"
          aria-label="View High Resolution Scan"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
          Full Scan
        </button>
      </div>

      <div
        className="press-clipping-frame"
        onClick={() => onOpenModal && onOpenModal(currentImg, activeTab === 'clipping' ? 'Chitralekha Feature Clipping · Page 38: "અમેરિકામાં રાસ-ગરબાની અલગ રિધમ..."' : 'Chitralekha Gujarati · Navratri 2025 Special Issue Cover')}
        title="Click to view scan full size"
      >
        <img
          src={currentImg}
          alt={activeTab === 'clipping' ? "Chitralekha feature clipping on Rythum Shastri" : "Chitralekha magazine cover Navratri 2025"}
          className={`press-clipping-img ${isFading ? 'is-fading' : ''}`}
          loading="lazy"
        />
        <div className="press-clipping-overlay">
          <span>Click to enlarge scan</span>
        </div>
      </div>

      <figcaption className="press-clipping-caption">
        {activeTab === 'clipping'
          ? 'Chitralekha Gujarati · September 29, 2025 · Page 38 ("અમેરિકામાં રાસ-ગરબાની અલગ રિધમ...")'
          : 'Chitralekha Gujarati · September 29, 2025 · Navratri Issue Cover'}
      </figcaption>
    </figure>
  );
}

export default function PressGrid({ items, preview = false }) {
  const grid = useRef(null);
  const [modalImg, setModalImg] = useState(null);
  const Heading = preview ? 'h3' : 'h2';

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray('.press-card', grid.current).forEach(card => {
        gsap.from(card, {
          y: 24, opacity: 0, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: card, start: 'top 96%', once: true },
          clearProps: 'transform,opacity',
        });
      });
    });
    return () => media.revert();
  }, [items]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setModalImg(null);
    };
    if (modalImg) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalImg]);

  return (
    <>
      <div ref={grid} className={`press-grid${preview ? ' press-grid-preview' : ''}`}>
        {items.map(item => {
          const Content = item.url ? 'a' : 'div';
          const isChitralekha = item.id === 'chitralekha';

          return (
            <article
              key={item.id}
              data-press-id={item.id}
              className={`press-card${isChitralekha ? ' press-card-cover' : ''}${!item.image && !isChitralekha ? ' press-card-textonly' : ''}`}
            >
              <Content
                className={`press-card-copy${item.url ? ' press-article-link' : ''}`}
                href={item.url}
                target={item.url ? '_blank' : undefined}
                rel={item.url ? 'noopener noreferrer' : undefined}
                aria-labelledby={item.url ? `press-headline-${item.id} press-new-tab-${item.id}` : undefined}
              >
                {!isChitralekha && item.image && (
                  <div className="press-card-media">
                    <img src={item.image} alt={item.headline} loading="lazy" />
                  </div>
                )}
                <div className="press-card-body">
                  <p className="press-outlet">{item.outlet}</p>
                  <Heading id={`press-headline-${item.id}`} className="press-headline">{item.headline}</Heading>
                  <p className="press-summary">{item.summary}</p>
                  <div className="press-card-meta">
                    {item.date ? <time dateTime={item.date}>{item.dateLabel}</time> : <span>{item.dateLabel}</span>}
                    {item.badge && <span className="press-badge">{item.badge}</span>}
                  </div>
                  {item.url && (
                    <>
                      <span className="press-read">Read Article →</span>
                      <span id={`press-new-tab-${item.id}`} className="press-sr-only"> (opens in a new tab)</span>
                    </>
                  )}
                </div>
              </Content>

              {isChitralekha && (
                <ChitralekhaFigure
                  item={item}
                  onOpenModal={(imgUrl, caption) => setModalImg({ url: imgUrl, caption })}
                />
              )}
            </article>
          );
        })}
      </div>

      {modalImg && (
        <div className="press-lightbox" role="dialog" aria-modal="true" onClick={() => setModalImg(null)}>
          <div className="press-lightbox-content" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="press-lightbox-close"
              onClick={() => setModalImg(null)}
              aria-label="Close scan view"
            >
              ✕
            </button>
            <img src={modalImg.url} alt={modalImg.caption} className="press-lightbox-img" />
            <p className="press-lightbox-caption">{modalImg.caption}</p>
          </div>
        </div>
      )}
    </>
  );
}
