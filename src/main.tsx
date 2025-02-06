import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Amplify } from '@aws-amplify/core';
import { store } from './store';
import { getTheme } from './theme';
import App from './App';
import './index.css';
import { useSelector } from 'react-redux';
import { selectThemeMode } from './store/slices/themeSlice';
import useTimeBasedTheme from './hooks/useTimeBasedTheme'; // new hook import

// Configure Amplify globally with environment variables
Amplify.configure({
  API: {
    endpoints: [
      {
        name: 'native',
        endpoint: 'https://uvept65zqg.execute-api.us-east-1.amazonaws.com/native/api/v1',
        region: import.meta.env.VITE_API_REGION || 'local',
        custom_header: async () => {
          const token = localStorage.getItem('auth_token');
          return {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          };
        },
      },
    ],
  },
});

const ThemedApp = () => {
  const themeMode = useSelector(selectThemeMode);
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  // Enable time-based theme switching.
  useTimeBasedTheme();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <App />
        </LocalizationProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

const Root = () => {
  return (
    <StrictMode>
      <Provider store={store}>
        <ThemedApp />
      </Provider>
    </StrictMode>
  );
};

createRoot(document.getElementById('root')!).render(<Root />);