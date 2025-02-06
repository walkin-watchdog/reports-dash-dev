import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room } from '../../types';

interface LiveState {
  rooms: Room[];
  labels: Record<string, string>;
  activeLabel: string | null;
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}

const initialState: LiveState = {
  rooms: [],
  labels: {},
  activeLabel: null,
  loading: false,
  error: null,
  lastUpdate: null,
};

const liveSlice = createSlice({
  name: 'live',
  initialState,
  reducers: {
    setRooms: (state, action: PayloadAction<Room[]>) => {
      state.rooms = action.payload;
      state.lastUpdate = new Date().toISOString();
    },
    setLabels: (state, action: PayloadAction<Record<string, string>>) => {
      state.labels = action.payload;
    },
    setActiveLabel: (state, action: PayloadAction<string | null>) => {
      state.activeLabel = action.payload;
    },
    updateRoom: (state, action: PayloadAction<Room>) => {
      const index = state.rooms.findIndex(room => room.id === action.payload.id);
      if (index !== -1) {
        state.rooms[index] = action.payload;
        state.lastUpdate = new Date().toISOString();
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    reset: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setRooms,
  setLabels,
  setActiveLabel,
  updateRoom,
  setLoading,
  setError,
  reset,
} = liveSlice.actions;

export default liveSlice.reducer;