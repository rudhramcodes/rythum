import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function SmoothField({ multiline = false, ...props }) {
  const field = useRef(null);
  const caret = useRef(null);
  const mirror = useRef(null);
  const Field = multiline ? 'textarea' : 'input';

  useEffect(() => {
    const input = field.current;
    const caretElement = caret.current;
    const marker = document.createElement('span');
    const measurement = mirror.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    function update() {
      const start = input.selectionStart;
      // Email inputs do not expose selection positions; keep their native caret accurate.
      const custom = start !== null && !reduced.matches;
      input.classList.toggle('has-smooth-caret', custom);
      const focused = document.activeElement === input;
      if (!custom || !focused || start !== input.selectionEnd) { caretElement.style.opacity = '0'; return; }
      const style = getComputedStyle(input);
      for (const property of ['font', 'letterSpacing', 'lineHeight', 'padding', 'borderWidth', 'boxSizing', 'textIndent', 'wordSpacing', 'tabSize']) measurement.style[property] = style[property];
      measurement.style.width = `${input.offsetWidth}px`;
      measurement.style.whiteSpace = multiline ? 'pre-wrap' : 'pre';
      measurement.style.overflowWrap = multiline ? 'break-word' : 'normal';
      measurement.textContent = input.value.slice(0, start);
      marker.textContent = input.value.slice(start) || '\u200b';
      measurement.append(marker);
      const rect = marker.getClientRects()[0];
      const box = measurement.getBoundingClientRect();
      const x = rect.left - box.left - input.scrollLeft;
      const y = rect.top - box.top - input.scrollTop;
      caretElement.style.height = `${parseFloat(style.fontSize) * 1.15}px`;
      caretElement.style.opacity = x >= 0 && x < input.clientWidth && y >= 0 && y < input.clientHeight ? '1' : '0';
      gsap.to(caretElement, { x, y, duration: 0.14, ease: 'power3.out', overwrite: true });
    }
    const events = ['input', 'focus', 'blur', 'select', 'keyup', 'pointerup', 'scroll', 'compositionend'];
    events.forEach(event => input.addEventListener(event, update));
    document.addEventListener('selectionchange', update);
    document.fonts.addEventListener('loadingdone', update);
    reduced.addEventListener('change', update);
    const resize = new ResizeObserver(update);
    resize.observe(input);
    return () => {
      events.forEach(event => input.removeEventListener(event, update));
      document.removeEventListener('selectionchange', update);
      document.fonts.removeEventListener('loadingdone', update);
      reduced.removeEventListener('change', update);
      resize.disconnect();
      gsap.killTweensOf(caretElement);
    };
  }, [multiline]);

  return <div className="smooth-field">
    <Field {...props} ref={field} />
    <span ref={mirror} className="smooth-field-mirror" aria-hidden="true" />
    <span ref={caret} className="smooth-field-caret" aria-hidden="true" />
  </div>;
}
