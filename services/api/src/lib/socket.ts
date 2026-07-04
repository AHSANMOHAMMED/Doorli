import type { Server } from 'socket.io';

let io: Server | null = null;

export function setSocketServer(server: Server): void {
  io = server;
}

export function getSocketServer(): Server | null {
  return io;
}

export function emitOrderEvent(
  event: 'order:new_order' | 'order:status_update',
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
