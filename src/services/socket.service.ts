// ==========================================
// REAL-TIME SOCKET.IO & WEBRTC SIGNALING SERVICE
// ==========================================

type EventHandler = (data: any) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private isConnected = false;
  private url: string;
  private token: string | null = null;
  private reconnectTimer: any = null;
  private broadcastChannel: BroadcastChannel | null = null;

  // Unique client/peer ID for this tab session
  public readonly clientId: string = `peer_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36).slice(-4)}`;

  public get connected(): boolean {
    return this.isConnected;
  }

  constructor() {
    const host = window.location.hostname || 'localhost';
    this.url = `ws://${host}:8000`;

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
    this.token = token || localStorage.getItem('token') || '';

    try {
      const wsUrl = `${this.url}/socket.io/?token=${encodeURIComponent(this.token)}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.emit('authenticate', { auth: { token: this.token }, clientId: this.clientId });
        this.triggerLocal('connect', { connected: true });
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event) {
            this.triggerLocal(parsed.event, parsed.data);
          }
        } catch {
          // Socket raw message or ping
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.triggerLocal('disconnect', {});
      };

      this.socket.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      this.isConnected = false;
    }
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.triggerLocal('disconnect', {});
  }

  public emit(event: string, payload?: any) {
    // 1. Send through WebSocket if active
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ event, data: payload, senderClientId: this.clientId }));
      } catch (err) {
        console.warn('Socket send error, forwarding locally:', err);
      }
    }

    // 2. Broadcast to other tabs on the same origin (for instant zero-backend WebRTC testing)
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

    // 3. Handle local reactive echoes for the current tab
    this.simulateLocalEventResponses(event, payload);
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

  private simulateLocalEventResponses(event: string, payload: any) {
    // When raising hand in single-tab mode, echo back so the local indicator reflects state
    if (event === 'raise_hand') {
      setTimeout(() => {
        this.triggerLocal('hand_raised', {
          userId: payload?.userId || 'my-user',
          userName: payload?.userName || 'Bạn',
          raisedAt: new Date().toLocaleTimeString('vi-VN'),
        });
      }, 50);
    }

    // If host mutes all in local mode
    if (event === 'mute_all_forced') {
      // do not echo to self if self is host, handled in cross-tab
    }

    // Whiteboard local stroke sync
    if (event === 'whiteboard_draw') {
      // Local draw already handled on mouse move
    }
  }
}

export const socketService = new SocketService();
export default socketService;
