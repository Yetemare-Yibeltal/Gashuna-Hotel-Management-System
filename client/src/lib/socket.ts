import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = (userId: string): void => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.emit('join-admin', userId);
  }
};

export const disconnectSocket = (): void => {
  if (socket?.connected) socket.disconnect();
};

export const joinRoomBoard = (): void => {
  getSocket().emit('join-room-board');
};

export const joinHousekeeping = (): void => {
  getSocket().emit('join-housekeeping');
};

export const joinKitchen = (): void => {
  getSocket().emit('join-kitchen');
};

export default getSocket;
