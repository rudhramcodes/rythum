import { Server } from 'socket.io';
import { fromNodeHeaders } from 'better-auth/node';
import { customerSession, tokenHash } from './customerAccess.js';

export function createRealtime(server, { db, config, auth }) {
  const io = new Server(server, {
    path: '/api/customer/realtime',
    cors: { origin: config.origins, credentials: true },
    allowRequest: (req, done) => done(null, config.origins.includes(req.headers.origin)),
    maxHttpBufferSize: 4096,
  });
  async function identity(socket) {
    if (socket.handshake.auth?.audience === 'admin') {
      const session = await auth?.api.getSession({ headers: fromNodeHeaders(socket.request.headers) });
      return session?.user.email.toLowerCase() === config.ADMIN_EMAIL ? { room: 'admins', id: session.session.id } : null;
    }
    if (socket.handshake.auth?.audience !== 'customer') return null;
    const session = await customerSession(db, config, socket.request.headers);
    return session ? { room: `customer:${tokenHash(session.email)}`, id: session._id } : null;
  }
  io.use(async (socket, next) => {
    try {
      const user = await identity(socket);
      if (!user) { const error = new Error('Please sign in again.'); error.data = { code: 'AUTH_REQUIRED' }; return next(error); }
      const connections = [...io.sockets.sockets.values()].filter(value => value.data.identity?.id === user.id).length;
      if (connections >= 8) return next(new Error('Too many chat connections. Close unused tabs.'));
      socket.data.identity = user;
      next();
    } catch { next(new Error('Chat connection unavailable.')); }
  });
  io.on('connection', socket => {
    socket.join(socket.data.identity.room);
    const check = setInterval(async () => {
      try { if (!await identity(socket)) { socket.emit('session:expired'); socket.disconnect(true); } }
      catch { socket.disconnect(true); }
    }, 30000);
    check.unref();
    socket.on('disconnect', () => clearInterval(check));
  });
  // shortcut: one API process; use a shared Socket.IO adapter before adding API replicas.
  async function publish({ reference, email, kind }) {
    const rooms = new Set(['admins', `customer:${tokenHash(email)}`]);
    await Promise.all([...io.sockets.sockets.values()].filter(socket => rooms.has(socket.data.identity?.room)).map(async socket => {
      try {
        // Recheck revocation before every event; never emit private notes or message bodies.
        const user = await identity(socket);
        if (!user || user.id !== socket.data.identity.id) { socket.emit('session:expired'); socket.disconnect(true); return; }
        socket.emit('inquiry:updated', { reference, kind });
      } catch { socket.disconnect(true); }
    }));
  }
  return { io, publish };
}
