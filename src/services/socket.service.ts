// ==========================================
// REAL-TIME SOCKET.IO & WEBRTC SIGNALING SERVICE
// ==========================================
import { connectSocket, getSocket, disconnectSocket } from './socket';
import type { Socket } from 'socket.io-client';

type EventHandler = (data: any) => void;

class SocketService {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  // Unique client/peer ID for this tab session
  public readonly clientId: string = `peer_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36).slice(-4)}`;

  public get connected(): boolean {
    const s = getSocket();
    return !!(s && s.connected);
  }

  public get rawSocket(): Socket | null {
    return getSocket();
  }

  constructor() {
    // Cross-tab broadcast channel for local peer signaling & real-time testing
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('preskool_teams_realtime_mesh');
        this.broadcastChannel.onmessage = (msgEvent) => {
          const { event, data, senderClientId } = msgEvent.data || {};
          // Only process messages from OTHER tabs/instances
          if (event && senderClientId !== this.clientId) {
            this.triggerLocal(event, data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization error:', err);
      }
    }
  }

  public connect(token?: string) {
    const authToken = token || localStorage.getItem('token') || '';
    const socket = connectSocket(authToken);

    // Re-bind registered listeners to the active Socket.io instance
    this.listeners.forEach((handlers, event) => {
      handlers.forEach((h) => {
        socket.off(event, h);
        socket.on(event, h);
      });
    });
  }

  public disconnect() {
    disconnectSocket();
  }

  public emit(event: string, payload?: any) {
    // 1. Send via Socket.io if active
    const s = getSocket();
    if (s && s.connected) {
      s.emit(event, payload);
    }

    // 2. Broadcast to other tabs on the same origin
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          event,
          data: payload,
          senderClientId: this.clientId,
        });
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }
  }

  public on(event: string, callback: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    const s = getSocket();
    if (s) {
      s.on(event, callback);
    }
  }

  public off(event: string, callback?: EventHandler) {
    if (!this.listeners.has(event)) return;
    const s = getSocket();
    if (callback) {
      this.listeners.get(event)!.delete(callback);
      if (s) s.off(event, callback);
    } else {
      this.listeners.delete(event);
      if (s) s.off(event);
    }
  }

  private triggerLocal(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(data);
        } catch (e) {
          console.error(`Error in socket listener for ${event}:`, e);
        }
      });
    }
  }
}

export const socketService = new SocketService();
export default socketService;
