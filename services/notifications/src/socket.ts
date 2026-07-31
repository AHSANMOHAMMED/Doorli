import type { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '@doorli/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_doorli_2026';

let io: Server | null = null;

export function setSocketServer(server: Server): void {
  io = server;
}

export function getSocketServer(): Server | null {
  return io;
}

export function emitOrderEvent(
  event: 'order:new_order' | 'order:status_update' | 'order:pos_sale',
  rooms: string[],
  payload: unknown,
): void {
  if (!io) return;
  for (const room of rooms) {
    io.to(room).emit(event, payload);
  }
}

export function emitDriverEvent(
  event: 'driver:new_job' | 'driver:location_update',
  rooms: string[],
  payload: unknown,
): void {
  if (!io) return;
  for (const room of rooms) {
    io.to(room).emit(event, payload);
  }
}

async function canJoinRoom(
  user: { id: string; role: string },
  room: string,
): Promise<boolean> {
  if (user.role === 'admin') return true;

  if (room === `customer:${user.id}`) return true;
  if (room === `driver:${user.id}`) return user.role === 'driver' || user.role === 'admin';
  if (room.startsWith('vendor:')) {
    const vendorId = room.slice('vendor:'.length);
    if (!vendorId) return false;
    if (user.role !== 'vendor' && user.role !== 'admin') return false;
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, userId: user.id },
      select: { id: true },
    });
    return Boolean(vendor);
  }
  if (room.startsWith('order:')) {
    const orderId = room.slice('order:'.length);
    if (!orderId) return false;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, driverId: true, vendor: { select: { userId: true } } },
    });
    if (!order) return false;
    return (
      order.customerId === user.id ||
      order.driverId === user.id ||
      order.vendor.userId === user.id
    );
  }
  if (room.startsWith('providers:')) {
    return user.role === 'vendor' || user.role === 'admin';
  }
  return false;
}

export function registerSocketAuth(ioServer: Server): void {
  ioServer.use((socket, next) => {
    const token =
      (typeof socket.handshake.auth?.token === 'string' && socket.handshake.auth.token) ||
      (typeof socket.handshake.query?.token === 'string' && socket.handshake.query.token) ||
      (socket.handshake.headers.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.slice(7)
        : null);

    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded || !decoded.userId) {
          return next(new Error('Authentication error'));
        }
        socket.data.user = decoded;
        next();
      } catch (err) {
        return next(new Error('Authentication error'));
      }
  });

  ioServer.on('connection', (socket: Socket) => {
    const user = socket.data.user as { id: string; role: string };
    void socket.join(`user:${user.id}`);
    if (user.role === 'customer') void socket.join(`customer:${user.id}`);
    if (user.role === 'driver') void socket.join(`driver:${user.id}`);

    socket.on('join', async (rooms: string | string[]) => {
      const list = Array.isArray(rooms) ? rooms : [rooms];
      for (const room of list) {
        if (typeof room !== 'string' || room.length === 0) continue;
        try {
          if (await canJoinRoom(user, room)) {
            await socket.join(room);
          }
        } catch {
          // ignore join failures
        }
      }
    });
  });
}
