import { post } from '@aws-amplify/api';
import { cache } from '../utils/caching';
import { isTokenExpired, isTokenNearExpiry } from '../utils/errorHandling';
import { JWTPayload, AuthResponse } from '../types/api';
import { Amplify } from '@aws-amplify/core';

const API_NAME = 'native';
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const refreshToken = async (): Promise<string> => {
  // In development with demo token, skip refresh
  if (import.meta.env.DEV && localStorage.getItem(TOKEN_KEY) === 'demo-token') {
    return 'demo-token';
  }

  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await post(API_NAME, '/refresh_token', {
      body: { refreshToken },
    });

    const { token } = response.body;
    localStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    throw error;
  }
};

export const setupTokenRefresh = () => {
  setInterval(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    // Skip token refresh for demo token
    if (import.meta.env.DEV && token === 'demo-token') {
      return;
    }
    if (token && isTokenNearExpiry(token)) {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }
  }, 60000); // Check every minute
};

export const getAuthToken = async (): Promise<string> => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error('No token available');

  // Always return demo token in development
  if (import.meta.env.DEV && token === 'demo-token') {
    return token;
  }

  if (isTokenExpired(token)) {
    return refreshToken();
  }

  return token;
};

export const setupApiInterceptor = () => {
  const endpoint = import.meta.env.DEV ? 
    'http://localhost:3000' : 
    import.meta.env.VITE_API_ENDPOINT;

  Amplify.configure({
    API: {
      endpoints: [
        {
          name: API_NAME,
          endpoint,
          region: import.meta.env.VITE_API_REGION,
        },
      ],
    },
  });
};