import { useEffect, useImperativeHandle, useRef } from 'react';
import gsap from 'gsap';

export default function SmoothField({ ref, multiline = false, error = '', type, id, ...props }) {
  const field = useRef(null);
  useImperativeHandle(ref, () => field.current, []);
  const caret = useRef(null);
  const mirror = useRef(null);
  const Field = multiline ? 'textarea' : 'input';

  // Browsers block selectionStart on input[type="email"], disabling smooth caret calculation.
  // Using type="text" with inputMode="email" provides full selection API access while preserving mobile email keyboards.
  const isEmail = type === 'email';
  const resolvedType = isEmail ? 'text' : type;
  const resolvedInputMode = isEmail ? (props.inputMode || 'email') : props.inputMode;

  useEffect(() => {
    const input = field.current;
    const caretElement = caret.current;
    const marker = document.createElement('span');
    const measurement = mirror.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    function update() {
      let start;
      try { start = input.selectionStart; } catch { start = null; }
      const custom = start !== null && !reduced.matches;
      input.classList.toggle('has-smooth-caret', custom);
      const focused = document.activeElement === input;
      if (!custom || !focused || start !== input.selectionEnd) { caretElement.style.opacity = '0'; return; }
      const style = getComputedStyle(input);
      for (const property of ['font', 'letterSpacing', 'lineHeight', 'padding', 'borderWidth', 'boxSizing', 'textIndent', 'wordSpacing', 'tabSize']) measurement.style[property] = style[property];
      measurement.style.width = `${input.offsetWidth}px`;
      measurement.style.whiteSpace = multiline ? 'pre-wrap' : 'pre';
      measurement.style.overflowWrap = multiline ? 'break-word' : 'normal';
      // Never copy a password into the measurement DOM.
      const displayValue = input.type === 'password' ? '•'.repeat(input.value.length) : input.value;
      measurement.textContent = displayValue.slice(0, start);
      marker.textContent = displayValue.slice(start) || '\u200b';
      measurement.append(marker);
      const rect = marker.getClientRects()[0];
      const box = measurement.getBoundingClientRect();
      const x = rect.left - box.left - input.scrollLeft;
      const fontSize = parseFloat(style.fontSize) || 16;
      const caretHeight = Math.round(fontSize * 1.05);
      const paddingTop = parseFloat(style.paddingTop) || 0;
      const paddingBottom = parseFloat(style.paddingBottom) || 0;
      const contentHeight = input.clientHeight - paddingTop - paddingBottom;
      const y = multiline
        ? (rect.top - box.top - input.scrollTop)
        : Math.round(paddingTop + (contentHeight - caretHeight) / 2 + 1.5);
      caretElement.style.height = `${caretHeight}px`;
      caretElement.style.opacity = x >= 0 && x < input.clientWidth && y >= 0 && y < input.clientHeight ? '1' : '0';
      gsap.to(caretElement, { x, y, duration: 0.14, ease: 'power3.out', overwrite: true });
    }


    const events = ['input', 'focus', 'blur', 'select', 'keyup', 'pointerup', 'scroll', 'compositionend'];
    events.forEach(event => input.addEventListener(event, update));
    document.addEventListener('selectionchange', update);
    document.fonts?.addEventListener?.('loadingdone', update);
    reduced.addEventListener('change', update);
    const resize = new ResizeObserver(update);
    resize.observe(input);

    return () => {
      events.forEach(event => input.removeEventListener(event, update));
      document.removeEventListener('selectionchange', update);
      document.fonts?.removeEventListener?.('loadingdone', update);
      reduced.removeEventListener('change', update);
      resize.disconnect();
      gsap.killTweensOf(caretElement);
    };
  }, [multiline, resolvedType]);

  return <div className="smooth-field-wrapper">
    <div className={`smooth-field${error ? ' is-invalid' : ''}`}>
      <Field
        {...props}
        id={id}
        type={resolvedType}
        inputMode={resolvedInputMode}
        ref={field}
        aria-invalid={Boolean(error)}
        aria-describedby={error && id ? `${id}-error` : props['aria-describedby']}
      />
      <span ref={mirror} className="smooth-field-mirror" aria-hidden="true" />
      <span ref={caret} className="smooth-field-caret" aria-hidden="true" />
    </div>
    {error && id && <p id={`${id}-error`} className="booking-field-error" role="alert">{error}</p>}
  </div>;
}
