import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function useRealtime(audience, onExpired, enabled = true) {
  const [realtime, setRealtime] = useState({ state: 'connecting', sequence: 0, event: null });
  useEffect(() => {
    if (!enabled) return;
    const socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
      path: '/api/customer/realtime', auth: { audience }, withCredentials: true,
      // WebSocket handshakes always include Origin, including through the local same-origin proxy.
      transports: ['websocket'],
      reconnectionDelay: 1000, reconnectionDelayMax: 10000,
    });
    socket.on('connect', () => setRealtime(value => ({ state: 'connected', sequence: value.sequence + 1, event: { kind: 'resync' } })));
    let reconnectTimer;
    socket.on('disconnect', reason => {
      setRealtime(value => ({ ...value, state: 'reconnecting' }));
      if (reason === 'io server disconnect') reconnectTimer = setTimeout(() => socket.connect(), 2000);
    });
    socket.on('connect_error', error => {
      setRealtime(value => ({ ...value, state: 'offline' }));
      if (error.data?.code === 'AUTH_REQUIRED') { socket.disconnect(); onExpired(); }
    });
    socket.on('session:expired', () => { socket.disconnect(); onExpired(); });
    socket.on('inquiry:updated', event => setRealtime(value => ({ ...value, sequence: value.sequence + 1, event })));
    const reconnect = () => { if (!socket.connected) socket.connect(); };
    window.addEventListener('online', reconnect);
    return () => { clearTimeout(reconnectTimer); window.removeEventListener('online', reconnect); socket.removeAllListeners(); socket.disconnect(); };
  }, [audience, onExpired, enabled]);
  return realtime;
}
