import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { messagePage } from './messagePage';
import { adminRequest } from './adminApi';
import useRealtime from './useRealtime';
import SmoothField from '../components/booking/SmoothField';

export default function Conversation({ reference, audience, onExpired, realtime: shared, initialDraft = '', onDraftChange, active = true }) {
  const local = useRealtime(audience, onExpired, !shared);
  const realtime = shared || local;
  const [result, setResult] = useState({ items: [], pages: 1 });
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [text, setText] = useState(initialDraft);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [below, setBelow] = useState(false);
  const attempt = useRef(null);
  const scroller = useRef(null);
  const room = useRef(null);
  const input = useRef(null);
  const follow = useRef(true);
  const lastKey = useRef('');
  const path = `${audience}/inquiries/${reference}/messages`;
  const event = realtime.event;
  const update = page === 1 && (!event?.reference || event.reference === reference) ? realtime.sequence : 0;
  useEffect(() => {
    if (!active) return;
    const frame = requestAnimationFrame(() => {
      follow.current = true;
      setPage(1);
      setBelow(false);
      if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
      room.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [active, reference]);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    adminRequest(`${path}?page=${page}`, { signal: controller.signal }).then(data => { setResult(previous => messagePage(previous, data, page)); setError(''); }).catch(error => {
      if (controller.signal.aborted) return;
      if (error.status === 401) onExpired(); else setError(error.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, page, refresh, onExpired, update, active]);
  useLayoutEffect(() => {
    const box = scroller.current;
    if (!box || !active) return;
    const newest = result.items.at(-1)?.key;
    if (follow.current) box.scrollTop = box.scrollHeight;
    else if (newest && newest !== lastKey.current && page === 1) setBelow(true);
    lastKey.current = newest;
  }, [result, page, active]);
  useLayoutEffect(() => {
    if (!input.current) return;
    input.current.style.height = 'auto';
    input.current.style.height = `${Math.min(input.current.scrollHeight, 140)}px`;
  }, [text, active]);
  function reload(nextPage = page) { follow.current = true; setBelow(false); setLoading(true); setError(''); setPage(nextPage); setRefresh(value => value + 1); }
  function draft(value) { setText(value); onDraftChange?.(value); }
  async function send(event) {
    event.preventDefault();
    if (sending || !text.trim()) return;
    if (!attempt.current || attempt.current.text !== text.trim()) attempt.current = { key: crypto.randomUUID(), text: text.trim() };
    setSending(true); setError(''); setNotice('');
    try {
      await adminRequest(path, { method: 'POST', body: JSON.stringify(attempt.current) });
      draft(''); attempt.current = null; setNotice('Message sent'); reload(1);
      requestAnimationFrame(() => input.current?.focus());
    } catch (error) { if (error.status === 401) onExpired(); else setError(error.message); }
    finally { setSending(false); }
  }
  function bottom() { follow.current = true; setBelow(false); if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }
  const ownRole = audience === 'admin' ? 'team' : 'customer';
  return <section ref={room} className="chat-room" aria-label="Inquiry conversation">
    <div className="chat-toolbar"><span className={`chat-connection is-${realtime.state}`}><i aria-hidden="true" />{realtime.state === 'connected' ? 'Live updates connected' : realtime.state === 'connecting' ? 'Connecting…' : 'Reconnecting · you can still send'}</span><button className="chat-icon" type="button" aria-label="Refresh messages" disabled={loading} onClick={() => reload()}><RefreshCw size={16} /></button></div>
    <div className="chat-scroll" ref={scroller} onScroll={() => { const box = scroller.current; follow.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80; if (follow.current) setBelow(false); }}>
      {result.pages > 1 && <div className="chat-history-controls"><button disabled={loading || page >= result.pages} onClick={() => reload(page + 1)}><ArrowLeft size={14} /> Older</button><span>{page === 1 ? 'Latest messages' : `History · ${page} / ${result.pages}`}</span><button disabled={loading || page === 1} onClick={() => reload(page - 1)}>Newer <ArrowRight size={14} /></button></div>}
      {loading && !result.items.length ? <p className="chat-loading" role="status">Loading your conversation…</p> : !result.items.length && !error ? <div className="chat-empty"><MessageCircle size={32} strokeWidth={1.4} /><h3>Let’s talk about your event.</h3><p>{audience === 'admin' ? 'Start a conversation with the customer. They’ll receive an email notification.' : 'Share timings, ask a question, or tell us a little more. Rythum’s team will reply here.'}</p></div> : <ol className="chat-messages">{result.items.map((message, index) => {
        const date = new Date(message.createdAt);
        const previous = result.items[index - 1];
        const day = date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
        const newDay = !previous || new Date(previous.createdAt).toDateString() !== date.toDateString();
        const mine = message.role === ownRole;
        return <li key={`${message.role}:${message.key}`}>
          {newDay && <div className="chat-day">{day}</div>}
          <div className={`chat-message ${mine ? 'is-mine' : 'is-theirs'}${message.arriving ? ' is-arriving' : ''}`}><span className="chat-sender">{mine ? 'You' : message.role === 'team' ? 'Rythum’s team' : 'Customer'}{!mine && audience === 'admin' && message.readByAdmin === false && <span className="chat-unread-indicator">New</span>}</span><div className="chat-bubble"><p>{message.text}</p><div className="chat-message-meta"><time dateTime={message.createdAt} title={date.toLocaleString(undefined, { hour12: true })}>{date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}</time>{mine && <Check size={13} aria-label="Sent" />}</div></div></div>
        </li>;
      })}</ol>}
    </div>
    {below && <button className="chat-new" type="button" onClick={bottom}>New messages <ArrowDown size={15} /></button>}
    {page > 1 && <button className="chat-latest" onClick={() => reload(1)}>Back to latest messages <ArrowDown size={15} aria-hidden="true" /></button>}
    {error && <div className="chat-error" role="alert">{error} <button type="button" onClick={() => reload()}>Refresh</button></div>}
    <form className="chat-compose" onSubmit={send}>
      <label className="sr-only" htmlFor={`reply-${reference}`}>{audience === 'admin' ? 'Message to customer' : 'Message to Rythum’s team'}</label>
      <div className="chat-compose-box"><SmoothField multiline id={`reply-${reference}`} ref={input} value={text} onChange={event => draft(event.target.value)} onKeyDown={event => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia('(pointer: fine)').matches) { event.preventDefault(); event.currentTarget.form.requestSubmit(); }
      }} disabled={sending} rows={1} required maxLength={5000} placeholder={audience === 'admin' ? 'Reply to the customer…' : 'Message Rythum’s team…'} /><button className="chat-send" disabled={sending || !text.trim()} type="submit" aria-label={sending ? 'Sending message' : 'Send message'}><Send size={19} /></button></div>
      <div className="chat-compose-footer"><span>{audience === 'admin' ? 'Visible to customer · private notes are separate' : 'Your conversation with Rythum’s team'}</span><span role="status">{sending ? 'Sending…' : text.length > 4500 ? `${text.length}/5000` : notice}</span></div>
    </form>
  </section>;
}
