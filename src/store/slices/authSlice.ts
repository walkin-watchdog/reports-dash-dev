// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  selectedHotel: string | null;
}

let savedToken: string | null = null;
let savedUser: User | null = null;

if (typeof window !== 'undefined') {
  savedToken = localStorage.getItem('auth_token');

  try {
    const raw = localStorage.getItem('user');
    savedUser = raw ? JSON.parse(raw) : null;
  } catch {
    console.warn('Could not parse saved user from localStorage');
    localStorage.removeItem('user');
  }
}

const initialState: AuthState = {
  user: savedUser,
  token: savedToken,
  isAuthenticated: Boolean(savedToken),
  selectedHotel:
    typeof window !== 'undefined'
      ? localStorage.getItem('selectedHotel')
      : null,
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

      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
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
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedHotel');
    },
  },
});

export const { setCredentials, setSelectedHotel, logout } = authSlice.actions;

export const selectCurrentUser = (state: { auth: AuthState }) =>
  state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectSelectedHotel = (state: { auth: AuthState }) =>
  state.auth.selectedHotel;

export default authSlice.reducer;