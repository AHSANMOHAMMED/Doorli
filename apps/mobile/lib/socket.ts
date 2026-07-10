import { io, type Socket } from 'socket.io-client';
import { API_URL } from './axios';
import { Platform } from 'react-native';

let socket: Socket | null = null;
let rideSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, { transports: ['websocket', 'polling'], autoConnect: true });
  }
  return socket;
}

const RIDE_SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8085' : 'http://localhost:8085';

export function getRideSocket(): Socket {
  if (!rideSocket) {
    rideSocket = io(RIDE_SOCKET_URL, { transports: ['websocket', 'polling'], autoConnect: false });
  }
  return rideSocket;
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
  if (rideSocket) {
    rideSocket.disconnect();
    rideSocket = null;
  }
}
