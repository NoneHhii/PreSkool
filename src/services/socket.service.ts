// ==========================================
// REAL-TIME SOCKET.IO & WEBRTC SIGNALING SERVICE
// Connected to PreSkool-BE teams.socket.ts via Socket.io
// ==========================================
import { connectSocket, getSocket, disconnectSocket } from './socket';
import type { Socket } from 'socket.io-client';

type EventHandler = (data: any) => void;

export const getSocketUrl = (): string => {
  const customSocket = localStorage.getItem('preskool_socket_url');
  if (customSocket) return customSocket;

  const customApi = localStorage.getItem('preskool_api_url');
  if (customApi) {
    try {
      const url = new URL(customApi);
      return `${url.protocol}//${url.host}`;
    } catch {
      // ignore
    }
  }

  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;

  if (import.meta.env.VITE_API_URL) {
    try {
      const url = new URL(import.meta.env.VITE_API_URL);
      return `${url.protocol}//${url.host}`;
    } catch {
      // ignore
    }
  }

  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:8000';
  }

  return 'https://preskool-socket.onrender.com';
};

class SocketService {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private isConnected = false;
  private token: string | null = null;
  private currentUserId: string = '';
  private broadcastChannel: BroadcastChannel | null = null;
  private processedEventIds = new Set<string>();

  // Unique client ID for this browser tab session
  public readonly clientId: string = `peer_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36).slice(-4)}`;

  public get connected(): boolean {
    const s = getSocket();
    return !!(s && s.connected) || this.isConnected;
  }

  public get socketInstance(): Socket | null {
    return getSocket();
  }

  public get rawSocket(): Socket | null {
    return getSocket();
  }

  constructor() {
    // Cross-tab broadcast channel for local peer signaling & real-time fallback
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('preskool_teams_realtime_mesh');
        this.broadcastChannel.onmessage = (msgEvent) => {
          const { event, data, senderClientId, eventId } = msgEvent.data || {};
          if (eventId && this.processedEventIds.has(eventId)) {
            return;
          }
          if (eventId) {
            this.processedEventIds.add(eventId);
            if (this.processedEventIds.size > 200) {
              const firstKey = this.processedEventIds.values().next().value;
              if (firstKey) this.processedEventIds.delete(firstKey);
            }
          }
          // Process messages from other tabs if for local tab sync
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
    this.token = token || localStorage.getItem('token') || '';
    const s = connectSocket(this.token);

    if (s) {
      this.isConnected = s.connected;

      // Re-register listeners on socket instance
      this.listeners.forEach((handlers, event) => {
        handlers.forEach((h) => {
          s.off(event, h);
          s.on(event, h);
        });
      });

      s.on('connect', () => {
        this.isConnected = true;
        this.triggerLocal('connect', { connected: true, id: s.id });
      });

      s.on('disconnect', (reason) => {
        this.isConnected = false;
        this.triggerLocal('disconnect', { reason });
      });
    }
  }

  public disconnect() {
    disconnectSocket();
    this.isConnected = false;
    this.triggerLocal('disconnect', {});
  }

  public joinConversation(conversationId: string) {
    this.emit('join_conversation', conversationId);
  }

  public emit(event: string, payload?: any) {
    // 1. Send through official Socket.io client if connected
    const s = getSocket();
    if (s && s.connected) {
      try {
        s.emit(event, payload);
      } catch (err) {
        console.warn('Socket.io emit error, fallback locally:', err);
      }
    }

    // 2. Broadcast to other tabs on the same origin (for zero-latency local WebRTC mesh & testing)
    if (this.broadcastChannel) {
      try {
        const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.processedEventIds.add(eventId);

        let broadcastEvent = event;
        let broadcastData = payload;

        if (event === 'direct_message') {
          broadcastEvent = 'new_direct_message';
          broadcastData = { ...payload, senderId: this.currentUserId, timestamp: new Date().toISOString() };
        } else if (event === 'channel_message') {
          broadcastEvent = 'new_channel_message';
          broadcastData = { ...payload, senderId: this.currentUserId, timestamp: new Date().toISOString() };
        } else if (event === 'typing' || event === 'user_typing') {
          broadcastEvent = 'user_typing';
          broadcastData = { ...payload, userId: this.currentUserId };
        } else if (event === 'join_meeting') {
          broadcastEvent = 'user_joined_meeting';
          broadcastData = {
            userId: this.currentUserId,
            meetingId: typeof payload === 'string' ? payload : payload?.meetingId,
            socketId: this.clientId,
          };
        } else if (event === 'leave_meeting') {
          broadcastEvent = 'user_left_meeting';
          broadcastData = {
            userId: this.currentUserId,
            meetingId: typeof payload === 'string' ? payload : payload?.meetingId,
          };
        } else if (
          event === 'webrtc_offer' ||
          event === 'webrtc_answer' ||
          event === 'webrtc_ice_candidate'
        ) {
          broadcastEvent = event;
          broadcastData = { ...payload, fromUserId: this.currentUserId };
        } else if (event === 'raise_hand') {
          broadcastEvent = 'hand_raised';
          broadcastData = { userId: this.currentUserId, raisedAt: new Date().toISOString() };
        } else if (event === 'lower_hand') {
          broadcastEvent = 'hand_lowered';
          broadcastData = { userId: this.currentUserId };
        } else if (event === 'mute_all_forced') {
          broadcastEvent = 'force_muted_by_host';
          broadcastData = { byHostId: this.currentUserId };
        } else if (event === 'live_poll_started') {
          broadcastEvent = 'new_live_poll';
          broadcastData = payload?.pollData ?? payload;
        } else if (event === 'whiteboard_draw') {
          broadcastEvent = 'whiteboard_stroke';
          broadcastData = { userId: this.currentUserId, strokeData: payload?.strokeData ?? payload };
        }

        this.broadcastChannel.postMessage({
          event: broadcastEvent,
          data: broadcastData,
          senderClientId: this.clientId,
          eventId,
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

  public triggerLocal(event: string, data: any) {
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
