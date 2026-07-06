import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './api';

let chatSocket: Socket | null = null;
let trackingSocket: Socket | null = null;

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('token') || undefined;
}

export function getChatSocket(): Socket {
  if (!chatSocket) {
    chatSocket = io(`${SOCKET_URL}/chat`, {
      auth: { token: getToken() },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return chatSocket;
}

export function getTrackingSocket(): Socket {
  if (!trackingSocket) {
    trackingSocket = io(`${SOCKET_URL}/tracking`, {
      auth: { token: getToken() },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return trackingSocket;
}

export function disconnectChatSocket() {
  chatSocket?.disconnect();
  chatSocket = null;
}

export function disconnectTrackingSocket() {
  trackingSocket?.disconnect();
  trackingSocket = null;
}
