import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, { transports: ['websocket', 'polling'], autoConnect: true });
  }
  return socket;
}

export function joinSocketRooms(rooms: string | string[]): void {
  getSocket().emit('join', rooms);
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
