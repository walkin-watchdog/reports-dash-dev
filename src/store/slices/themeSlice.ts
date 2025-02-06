import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  mode: 'light' | 'dark';
  autoToggle: boolean;
}

const initialState: ThemeState = {
  mode: 'light',
  autoToggle: true,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload;
    },
    toggleAutoTheme: (state) => {
      state.autoToggle = !state.autoToggle;
    },
    setAutoTheme: (state, action: PayloadAction<boolean>) => {
      state.autoToggle = action.payload;
    },
  },
});

export const { toggleTheme, setTheme, toggleAutoTheme, setAutoTheme } = themeSlice.actions;
export const selectThemeMode = (state: { theme: ThemeState }) => state.theme.mode;
export const selectAutoTheme = (state: { theme: ThemeState }) => state.theme.autoToggle;

export default themeSlice.reducer;