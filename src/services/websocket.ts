import { BroadcastChannel } from 'broadcast-channel';
import { analytics } from '../utils/analytics';

interface WebSocketMessage {
  type: string;
  payload: any;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageChannel: BroadcastChannel;
  private pingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.messageChannel = new BroadcastChannel('websocket_messages');
    this.setupMessageChannel();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private setupMessageChannel() {
    this.messageChannel.onmessage = (msg) => {
      if (msg.type === 'RECONNECT') {
        this.connect();
      }
    };
  }

  public connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem('auth_token');
    const selectedHotel = localStorage.getItem('selectedHotel');
    
    if (!token || !selectedHotel) {
      console.error('Missing authentication token or hotel selection');
      return;
    }

    const wsUrl = import.meta.env.DEV
      ? `ws://localhost:3000/ws?token=${token}&hotelId=${selectedHotel}`
      : `${import.meta.env.VITE_WS_ENDPOINT}?token=${token}&hotelId=${selectedHotel}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startPingInterval();
      analytics.trackEvent('WebSocket', 'Connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.messageChannel.postMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.handleDisconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      analytics.trackEvent('WebSocket', 'Error');
    };
  }

  private startPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private handleDisconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      analytics.trackEvent('WebSocket', 'Max Reconnect Attempts Reached');
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  public send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  public subscribe(callback: (message: WebSocketMessage) => void): () => void {
    const handler = (event: MessageEvent) => {
      callback(event.data);
    };
    this.messageChannel.addEventListener('message', handler);
    return () => {
      this.messageChannel.removeEventListener('message', handler);
    };
  }
}