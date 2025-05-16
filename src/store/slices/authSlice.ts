import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  selectedHotel: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  selectedHotel: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.selectedHotel = user.hotels[0]?.id || null;
      localStorage.setItem('selectedHotel', user.hotels[0]?.id || '');
    },
    setSelectedHotel: (state, action: PayloadAction<string>) => {
      state.selectedHotel = action.payload;
      localStorage.setItem('selectedHotel', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.selectedHotel = null;
      localStorage.removeItem('selectedHotel');
      localStorage.removeItem('token');
    },
  },
});

export const { setCredentials, setSelectedHotel, logout } = authSlice.actions;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectSelectedHotel = (state: { auth: AuthState }) =>
  state.auth.selectedHotel;

export default authSlice.reducer;