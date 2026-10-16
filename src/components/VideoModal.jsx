import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export default function VideoModal({ isOpen, onClose, videoId, title = 'Video' }) {
  const dialog = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const element = dialog.current;
    const previous = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = previous; };
  }, [isOpen]);
  if (!isOpen || !videoId) return null;
  return <dialog ref={dialog} data-lenis-prevent className="video-dialog" aria-labelledby="video-title" onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose(); }}><div className="dialog-panel" data-lenis-prevent><div className="dialog-header"><h2 id="video-title">{title}</h2><button onClick={onClose} aria-label="Close video" autoFocus><X size={22} /></button></div><div className="dialog-video"><iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div><p>Video unavailable? <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></p></div></dialog>;
}
