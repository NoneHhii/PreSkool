// ==========================================
// REAL-TIME SOCKET.IO & WEBRTC SIGNALING SERVICE
// Connected to PreSkool-BE teams.socket.ts
// ==========================================

import { io, Socket } from 'socket.io-client';

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

  return 'https://pre-skool-be.vercel.app';
};

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private isConnected = false;
  private socketUrl: string;
  private token: string | null = null;
  private currentUserId: string = '';
  private broadcastChannel: BroadcastChannel | null = null;
  private processedEventIds = new Set<string>();

  // Unique client ID for this browser tab session
  public readonly clientId: string = `peer_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36).slice(-4)}`;

  public get connected(): boolean {
    return this.isConnected && (this.socket?.connected ?? false);
  }

  public get socketInstance(): Socket | null {
    return this.socket;
  }

  constructor() {
    this.socketUrl = getSocketUrl();

    // Cross-tab broadcast channel for local synchronization & fallback
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
          // Process messages from other tabs if socket is disconnected or for local tab sync
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
    const nextToken = token || localStorage.getItem('token') || '';
    if (this.socket?.connected && this.token === nextToken) {
      return;
    }

    this.token = nextToken;
    this.socketUrl = getSocketUrl();

    // Extract currentUserId from JWT token or localStorage
    try {
      if (this.token && this.token.includes('.')) {
        const payloadBase64 = this.token.split('.')[1];
        const decoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
        this.currentUserId = decoded.userId || decoded.id || '';
      }
    } catch {
      // ignore
    }
    if (!this.currentUserId) {
      try {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        this.currentUserId = savedUser.id || savedUser.userId || '';
      } catch {
        // ignore
      }
    }

    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch {
        // ignore
      }
      this.socket = null;
    }

    try {
      this.socket = io(this.socketUrl, {
        auth: { token: this.token },
        extraHeaders: this.token ? { Authorization: `Bearer ${this.token}` } : {},
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.triggerLocal('connect', { connected: true, socketId: this.socket?.id });
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        this.triggerLocal('disconnect', { reason });
      });

      this.socket.on('connect_error', (error) => {
        this.isConnected = false;
        this.triggerLocal('connect_error', error);
      });

      // 17 Real-time Events from teams.socket.ts:
      const forwardedEvents = [
        'presence_change',
        'user_joined_meeting',
        'user_left_meeting',
        'user_typing',
        'new_channel_message',
        'new_direct_message',
        'webrtc_offer',
        'webrtc_answer',
        'webrtc_ice_candidate',
        'hand_raised',
        'hand_lowered',
        'force_muted_by_host',
        'new_live_poll',
        'whiteboard_stroke',
      ];

      forwardedEvents.forEach((evtName) => {
        this.socket?.on(evtName, (payload: any) => {
          this.triggerLocal(evtName, payload);
        });
      });

      this.socket.connect();
    } catch (err) {
      this.isConnected = false;
      this.triggerLocal('connect_error', err);
    }
  }

  public disconnect() {
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch {
        // ignore
      }
      this.socket = null;
    }
    this.isConnected = false;
    this.triggerLocal('disconnect', {});
  }

  public emit(event: string, payload?: any) {
    const eventId = `${this.clientId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.processedEventIds.add(eventId);

    // 1. If Socket.IO is connected, emit ONLY to Socket.IO Server and return immediately!
    if (this.socket && this.socket.connected) {
      try {
        this.socket.emit(event, payload);
      } catch (err) {
        console.warn(`Socket.IO emit failed for ${event}:`, err);
      }
      return;
    }

    // 2. ONLY when disconnected, broadcast fallback across local tabs with Server-to-Client translation
    if (this.broadcastChannel) {
      try {
        let broadcastEvent = event;
        let broadcastData = payload;

        if (event === 'direct_message') {
          broadcastEvent = 'new_direct_message';
          broadcastData = { ...payload, senderId: this.currentUserId, timestamp: new Date().toISOString() };
        } else if (event === 'channel_message') {
          broadcastEvent = 'new_channel_message';
          broadcastData = { ...payload, senderId: this.currentUserId, timestamp: new Date().toISOString() };
        } else if (event === 'typing') {
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
  }

  public off(event: string, callback?: EventHandler) {
    if (!this.listeners.has(event)) return;
    if (callback) {
      this.listeners.get(event)!.delete(callback);
    } else {
      this.listeners.delete(event);
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

  // Helper typing methods for clear payload adherence
  public joinChannel(channelId: string) {
    this.emit('join_channel', channelId);
  }

  public leaveChannel(channelId: string) {
    this.emit('leave_channel', channelId);
  }

  public joinConversation(conversationId: string) {
    this.emit('join_conversation', conversationId);
  }

  public joinMeeting(meetingId: string) {
    // Crucial: Payload must be string meetingId
    this.emit('join_meeting', meetingId);
  }

  public leaveMeeting(meetingId: string) {
    // Crucial: Payload must be string meetingId
    this.emit('leave_meeting', meetingId);
  }
}

export const socketService = new SocketService();
export default socketService;
