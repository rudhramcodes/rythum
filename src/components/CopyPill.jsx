import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import './copyPill.css';

export default function CopyPill({ text, label = 'Copy', monospace = true, className = '', fullWidth = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async e => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={`copy-pill ${copied ? 'is-copied' : ''} ${fullWidth ? 'is-full-width' : ''} ${className}`}>
      <span className={`copy-pill-text ${monospace ? 'is-mono' : ''}`}>{text}</span>
      <div className="copy-pill-divider" aria-hidden="true" />
      <button
        type="button"
        className="copy-pill-action"
        onClick={handleCopy}
        title={copied ? 'Copied to clipboard!' : `Copy ${label}`}
        aria-label={copied ? 'Copied to clipboard' : `Copy ${label}`}
      >
        <span className="copy-pill-icon">
          {copied ? <Check size={16} className="copy-pill-check" /> : <Copy size={16} />}
        </span>
      </button>
    </div>
  );
}
