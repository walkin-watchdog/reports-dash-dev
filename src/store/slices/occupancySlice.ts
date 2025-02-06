import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OccupancyRecord, OccupancySummary } from '../../types/api';

interface OccupancyState {
  currentData: {
    records: OccupancyRecord[];
    summary: OccupancySummary | null;
  };
  rangeData: {
    [date: string]: {
      records: OccupancyRecord[];
      summary: OccupancySummary;
    };
  };
  loading: boolean;
  error: string | null;
}

const initialState: OccupancyState = {
  currentData: {
    records: [],
    summary: null,
  },
  rangeData: {},
  loading: false,
  error: null,
};

const occupancySlice = createSlice({
  name: 'occupancy',
  initialState,
  reducers: {
    setCurrentData: (
      state,
      action: PayloadAction<{
        records: OccupancyRecord[];
        summary: OccupancySummary;
      }>
    ) => {
      state.currentData = action.payload;
    },
    addRangeData: (
      state,
      action: PayloadAction<{
        date: string;
        records: OccupancyRecord[];
        summary: OccupancySummary;
      }>
    ) => {
      const { date, records, summary } = action.payload;
      state.rangeData[date] = { records, summary };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearData: (state) => {
      state.currentData = { records: [], summary: null };
      state.rangeData = {};
      state.error = null;
    },
  },
});

export const {
  setCurrentData,
  addRangeData,
  setLoading,
  setError,
  clearData,
} = occupancySlice.actions;

export default occupancySlice.reducer;