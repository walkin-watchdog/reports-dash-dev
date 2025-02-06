export const websocketConfig = {
  endpoint: import.meta.env.DEV 
    ? 'ws://localhost:3000/ws'
    : import.meta.env.VITE_WS_ENDPOINT,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  pingInterval: 30000,
  messageTypes: {
    INITIAL_DATA: 'INITIAL_DATA',
    ROOM_UPDATE: 'ROOM_UPDATE',
    PING: 'PING',
    ERROR: 'ERROR',
  },
  channels: {
    SYNC: 'websocket_messages',
    RECONNECT: 'RECONNECT',
  },
};