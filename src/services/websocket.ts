import { BroadcastChannel } from 'broadcast-channel';
import { sha256 } from 'js-sha256';
import { analytics } from '../utils/analytics';
import { CacheStorage } from './cacheStorage';
import { store } from '../store';
import {
  setEntities,
  setLog,
  setRoomState,
  setRoomInactive,
} from '../store/slices/mainSlice';
import { Room } from '../types';
import { getAuthToken } from './authService';

/* -------------------------------------------------------------------- */
/*                         ENUMS & TYPE MAPS                            */
/* -------------------------------------------------------------------- */

export enum WebSocketMessageType {
  INITIAL_DATA    = 'INITIAL_DATA',
  ROOM_UPDATE     = 'ROOM_UPDATE',
  PING            = 'PING',
  ERROR           = 'ERROR',
  SUBSCRIBE_HOTEL = 'SUBSCRIBE_HOTEL',
  DISCONNECT      = 'DISCONNECT',
}

export enum ConnectionState {
  CONNECTING  = 'CONNECTING',
  CONNECTED   = 'CONNECTED',
  DISCONNECTED= 'DISCONNECTED',
  RECONNECTING= 'RECONNECTING',
  FAILED      = 'FAILED',
}

interface RoomUpdatePayload {
  id: string;
  is_vacant: boolean;
  is_inactive?: boolean;
}

type WebSocketMessageMap = {
  [WebSocketMessageType.INITIAL_DATA]: { rooms: Room[]; labels: Record<string,string> };
  [WebSocketMessageType.ROOM_UPDATE]:  RoomUpdatePayload | RoomUpdatePayload[];
  [WebSocketMessageType.PING]:         null;
  [WebSocketMessageType.ERROR]:        { message: string };
  [WebSocketMessageType.SUBSCRIBE_HOTEL]: { hotelId: string };
  [WebSocketMessageType.DISCONNECT]:      null;
};

export type WebSocketMessage<K extends WebSocketMessageType = WebSocketMessageType> = {
  type:       K;
  payload:    WebSocketMessageMap[K];
  timestamp:  number;
  messageId:  string;
};

/* -------------------------------------------------------------------- */
/*                           CONFIG                                     */
/* -------------------------------------------------------------------- */

export const websocketConfig = {
  endpoint: import.meta.env.DEV
    ? 'ws://localhost:3000/ws'
    : import.meta.env.VITE_WS_ENDPOINT,
  reconnect: {
    maxAttempts : 5,
    initialDelay: 1000,
    maxDelay   : 30000,
    factor     : 2,
  },
  ping: {
    interval: 30000,
    timeout : 5000,
  },
  validation: {
    maxMessageSize: 1024 * 1024, // 1 MB
    allowedTypes  : Object.values(WebSocketMessageType),
  },
  channels: {
    SYNC     : 'websocket_messages',
    RECONNECT: 'websocket_reconnect',
  },
};

/* -------------------------------------------------------------------- */
/*                         SERVICE CLASS                                */
/* -------------------------------------------------------------------- */

export class WebSocketService {
  /* ------------- singleton bits --------------- */
  private static instance: WebSocketService;
  public  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }
  private constructor() {
    this.messageChannel = new BroadcastChannel(websocketConfig.channels.SYNC);
    this.setupMessageChannel();
    this.cache = CacheStorage.getInstance();
  }

  /* ------------- private fields --------------- */
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;

  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private pingInterval: NodeJS.Timeout | null = null;

  // outbound buffering + ACK bookkeeping
  private messageQueue:   WebSocketMessage[] = [];
  private pendingMessages = new Map<
    string,
    { message: WebSocketMessage; timestamp: number; attempts: number }
  >();

  // broadcast-channel
  private messageChannel: BroadcastChannel;

  // cache
  private cache: CacheStorage;

  // snapshot
  private lastInitialData: WebSocketMessage | null = null;

  /* ------------------------------------------------------------------ */
  /*                          PUBLIC API                                */
  /* ------------------------------------------------------------------ */

  /** Connect (or reconnect) to the socket.  
   *  Pass the current hotelId every time so a new tab can switch hotels. */
  public connect() {
    const hotelId = localStorage.getItem('selectedHotel');
    if (!hotelId) {
      console.error('[WS] missing hotelId');
      return;
    }

    // dev mode is handled in the provider; we only need a dummy state here
    if (import.meta.env.DEV) {
      this.setConnectionState(ConnectionState.CONNECTED);
      return;
    }

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
      this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) return; // already open

    const token = getAuthToken();
    if (!token) {
      console.error('[WS] missing auth token');
      return;
    }

    this.setConnectionState(ConnectionState.CONNECTING);

    /*  Build URL: keep the “hotelId” in query string **and** send explicit
        SUBSCRIBE_HOTEL later so the server can support either style.       */
    const url =
      `${websocketConfig.endpoint}?token=${token}&hotelId=${hotelId}`;

    this.ws              = new WebSocket(url);
    this.ws.onopen       = () => this.handleOpen();
    this.ws.onmessage    = (e) => this.handleMessage(e);
    this.ws.onerror      = (e) => this.handleError(e);
    this.ws.onclose      = () => this.handleClose();
  }

  public disconnect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      // send polite FIN
      const msg: WebSocketMessage<WebSocketMessageType.DISCONNECT> = {
        type: WebSocketMessageType.DISCONNECT,
        payload: null,
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
      };
      this.ws.send(JSON.stringify(msg));
      this.pendingMessages.set(msg.messageId, {
        message: msg,
        timestamp: Date.now(),
        attempts: 1,
      });
    }

    this.cleanup();
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState(ConnectionState.DISCONNECTED);
  }

  /** Fan-out for UI layers. */
  public subscribe(cb: (msg: WebSocketMessage) => void): () => void {
    if (this.lastInitialData) cb(this.lastInitialData);

    const handler = (ev: MessageEvent) => cb(ev.data);
    this.messageChannel.addEventListener('message', handler);

    return () => {
      this.messageChannel.removeEventListener('message', handler);
    };
  }
  
  /** Send a message to the server. */
  public sendRoomUpdate(update: RoomUpdatePayload) {
    // build the message with a fresh ID
    const msg: WebSocketMessage<WebSocketMessageType.ROOM_UPDATE> = {
      type:       WebSocketMessageType.ROOM_UPDATE,
      payload:    update,
      timestamp:  Date.now(),
      messageId:  this.generateMessageId(),
    };
    this.send(msg);
  }

  public getConnectionState() { return this.connectionState; }

  /* ------------------------------------------------------------------ */
  /*                    INTERNAL – LIFECYCLE HANDLERS                   */
  /* ------------------------------------------------------------------ */

  private handleOpen() {
    console.log('[WS] connected');
    this.setConnectionState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    analytics.trackEvent('WebSocket', 'Connected');

    // kick-off keep-alive loop
    this.startPingInterval();

    // flush queued outbound messages
    this.processMessageQueue();

    // explicitly subscribe to the hotel
    const hotelId = localStorage.getItem('selectedHotel');
    if (hotelId) {
      this.send({
        type      : WebSocketMessageType.SUBSCRIBE_HOTEL,
        payload   : { hotelId },
        timestamp : Date.now(),
        messageId : this.generateMessageId(),
      });
    }
  }

  private handleMessage(event: MessageEvent) {
    let message: WebSocketMessage;
    try {
      message = JSON.parse(event.data);
    } catch (err) {
      console.error('[WS] malformed JSON', err);
      return;
    }

    if (!this.validateMessage(message)) {
      console.error('[WS] invalid message', message);
      return;
    }

    /* ----------- ping / pong ---------- */
    if (message.type === WebSocketMessageType.PING) {
      return;
    }

    /* ----------- business messages ---- */
    if (message.type === WebSocketMessageType.INITIAL_DATA) {
      const payload = message.payload as { rooms: Room[]; labels: Record<string,string> };
      store.dispatch(setEntities(payload));
      store.dispatch(setLog(false));
      this.lastInitialData = message;
    }

    if (message.type === WebSocketMessageType.ROOM_UPDATE) {
      const updates = Array.isArray(message.payload)
        ? message.payload
        : [message.payload as RoomUpdatePayload];

      const hotelId = localStorage.getItem('selectedHotel');
      updates.forEach((u) => {
        store.dispatch(setRoomState   ({ id: u.id, state:    u.is_vacant   }));
        store.dispatch(setRoomInactive({ id: u.id, inactive: u.is_inactive ?? false }));
        if (hotelId) {
          this.cache.updateRoom({
            hotelId,
            id: u.id,
            is_vacant: u.is_vacant,
            is_inactive: u.is_inactive ?? false,
          }).catch(console.error);
        }
      });
    }

    analytics.trackEvent(
      'WebSocket',
      'Message Received',
      message.type,
      message.type === WebSocketMessageType.ROOM_UPDATE ? 1 : undefined
    );

    /* rebroadcast to other tabs */
    this.messageChannel.postMessage(message);

    /* mark ACK-ed */
    this.handleAck(message.messageId);
  }

  private handleError(err: Event) {
    console.error('[WS] socket error', err);
    this.setConnectionState(ConnectionState.FAILED);
    analytics.trackEvent('WebSocket', 'Error');
  }

  private handleClose() {
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.cleanup();
    this.scheduleReconnect();
  }

  /* ------------------------------------------------------------------ */
  /*                       VALIDATION & UTILITY                         */
  /* ------------------------------------------------------------------ */

  private validateMessage(m: WebSocketMessage): boolean {
    return (
      m &&
      typeof m.type === 'string' &&
      websocketConfig.validation.allowedTypes.includes(m.type) &&
      typeof m.timestamp === 'number' &&
      typeof m.messageId === 'string' &&
      JSON.stringify(m).length <= websocketConfig.validation.maxMessageSize
    );
  }

  private generateMessageId() {
    return sha256(Date.now().toString() + Math.random().toString()).slice(0, 8);
  }

  /* ------------------------------------------------------------------ */
  /*                      KEEP-ALIVE / PING-PONG                         */
  /* ------------------------------------------------------------------ */

  private startPingInterval() {
    if (this.pingInterval) clearInterval(this.pingInterval);

    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type      : WebSocketMessageType.PING,
          payload   : null,
          timestamp : Date.now(),
          messageId : this.generateMessageId(),
        });
      }
    }, websocketConfig.ping.interval);
  }

  private handlePing() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type      : WebSocketMessageType.PING,
        payload   : null,
        timestamp : Date.now(),
        messageId : this.generateMessageId(),
      }));
    }
  }

  /* ------------------------------------------------------------------ */
  /*                  OUTBOUND QUEUE / ACK TRACKING                      */
  /* ------------------------------------------------------------------ */

  public send(msg: WebSocketMessage) {
    if (this.connectionState !== ConnectionState.CONNECTED ||
        !this.ws ||
        this.ws.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(msg);   // buffer til socket ready
      return;
    }

    try {
      const json = JSON.stringify(msg);
      if (json.length > websocketConfig.validation.maxMessageSize) {
        throw new Error('msg > 1 MB');
      }
      this.ws.send(json);
      this.pendingMessages.set(msg.messageId, {
        message  : msg,
        timestamp: Date.now(),
        attempts : 1,
      });
    } catch (e) {
      console.error('[WS] send failed → requeued', e);
      this.messageQueue.push(msg);
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length &&
           this.ws?.readyState === WebSocket.OPEN) {
      const next = this.messageQueue.shift()!;
      this.send(next);
    }
  }

  private handleAck(messageId: string) {
    this.pendingMessages.delete(messageId);
  }

  /* ------------------------------------------------------------------ */
  /*               RECONNECT, CLEAN-UP, STATE HELPERS                   */
  /* ------------------------------------------------------------------ */

  private cleanup() {
    if (this.pingInterval)    { clearInterval(this.pingInterval); }
    if (this.reconnectTimeout){ clearTimeout(this.reconnectTimeout); }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= websocketConfig.reconnect.maxAttempts) {
      this.setConnectionState(ConnectionState.FAILED);
      analytics.trackEvent('WebSocket', 'Max Reconnect Attempts Reached');
      return;
    }

    const delay = Math.min(
      websocketConfig.reconnect.initialDelay *
        Math.pow(websocketConfig.reconnect.factor, this.reconnectAttempts),
      websocketConfig.reconnect.maxDelay,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.setConnectionState(ConnectionState.RECONNECTING);
      this.connect();
    }, delay);
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    analytics.trackEvent('WebSocket', `State: ${state}`);
  }

  /* ------------------------------------------------------------------ */
  /*             CROSS-TAB SYNC (BroadcastChannel)                      */
  /* ------------------------------------------------------------------ */

  private setupMessageChannel() {
    this.messageChannel.addEventListener('message', (ev) => {
      // external trigger to force a reconnect
      if (ev.data?.type === websocketConfig.channels.RECONNECT) {
        this.connect();
      }
    });
  }
}