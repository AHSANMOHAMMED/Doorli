import { io, type Socket } from 'socket.io-client';
import { API_ROOT } from './axios';
import { useAuthStore } from '../store/auth';

let socket: Socket | null = null;

/** Single Socket.io connection on API origin (orders + rides). */
export function getSocket(): Socket {
  const token = useAuthStore.getState().accessToken;
  if (!socket) {
    socket = io(API_ROOT, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: { token },
      path: '/socket.io',
    });
  } else if (token) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
  }
  return socket;
}

/** @deprecated Use getSocket() — rides share the API socket. */
export function getRideSocket(): Socket {
  return getSocket();
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

export function disconnectRideSocket(): void {
  // no-op: shared socket
}
