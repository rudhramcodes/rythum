import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const VideoModal = ({ isOpen, onClose, videoId, title = 'Video Player' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !videoId) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl bg-[#0D0A08] border border-[#D9A441]/30 rounded-2xl overflow-hidden shadow-2xl z-10">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#281D18] bg-[#140F0D]">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9A441] animate-ping" />
            <h3 className="text-sm font-semibold tracking-wider text-[#F5EFE4] uppercase font-display">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#F5EFE4]/70 hover:text-[#D9A441] hover:bg-[#281D18] transition-colors"
            aria-label="Close video"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Responsive Frame */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
