import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import occupancyReducer from './slices/occupancySlice';
import themeReducer from './slices/themeSlice';
import mainReducer from './slices/mainSlice';
import liveReducer from './slices/liveSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    occupancy: occupancyReducer,
    theme: themeReducer,
    main: mainReducer,
    live: liveReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;