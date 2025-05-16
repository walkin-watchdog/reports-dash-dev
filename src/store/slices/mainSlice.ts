import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room } from '../../types';

interface MainState {
  waiting: boolean;
  platform: {
    os: string;
    is_touch: boolean;
  };
  rooms: Room[];
  labels: Record<string, string>;
  room_types: Record<string, any>;
  device_id: Record<string, any>;
  error: boolean;
}

const initialState: MainState = {
  waiting: false,
  platform: {
    os: typeof navigator !== 'undefined' && navigator.platform ? 
      (navigator.platform.toLowerCase().includes('mac') ? 'mac' : 
       navigator.platform.toLowerCase().includes('win') ? 'windows' : 'other') : 'other',
    is_touch: typeof window !== 'undefined' ? ('ontouchstart' in window || navigator.maxTouchPoints > 0) : false
  },
  rooms: [],
  labels: {
    'premium': 'Premium',
    'standard': 'Standard',
    'suite': 'Suite'
  },
  room_types: {},
  device_id: {},
  error: false
};

const mainSlice = createSlice({
  name: 'main',
  initialState,
  reducers: {
    setLog: (state, action: PayloadAction<boolean>) => {
      state.error = action.payload;
    },
    setEntities: (state, action: PayloadAction<{ rooms: Room[]; labels: Record<string, string> }>) => {
      state.rooms = action.payload.rooms || [];
      // Only update labels if they exist in the payload
      if (action.payload.labels && Object.keys(action.payload.labels).length > 0) {
        state.labels = action.payload.labels;
      }
    },
    setRoomState: (state, action: PayloadAction<{ id: string; state: boolean }>) => {
      const room = state.rooms.find(r => r.id === action.payload.id);
      if (room) {
        room.is_vacant = action.payload.state;
      }
    },
    setRoomInactive: (
      state,
      action: PayloadAction<{ id: string; inactive: boolean }>
    ) => {
      const room = state.rooms.find(r => r.id === action.payload.id);
      if (room) {
        room.is_inactive = action.payload.inactive;
      }
    },
    setDeviceId: (state, action: PayloadAction<Record<string, any>>) => {
      state.device_id = action.payload;
    },
    setWaiting: (state, action: PayloadAction<boolean>) => {
      state.waiting = action.payload;
    },
    setPlatform: (state, action: PayloadAction<{ os: string; is_touch: boolean }>) => {
      state.platform = action.payload;
    }
  }
});

export const {
  setLog,
  setEntities,
  setRoomState,
  setRoomInactive,
  setDeviceId,
  setWaiting,
  setPlatform
} = mainSlice.actions;

export default mainSlice.reducer;