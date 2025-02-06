/**
 * API Configuration
 * Centralizes all API-related configuration and endpoints
 */

const config = {
  api: {
    name: import.meta.env.VITE_API_NAME,
    endpoint: import.meta.env.VITE_API_ENDPOINT,
    region: import.meta.env.VITE_API_REGION,
    basePath: import.meta.env.VITE_API_BASE_PATH,
    version: import.meta.env.VITE_API_VERSION,
  },
  endpoints: {
    auth: {
      login: import.meta.env.VITE_AUTH_LOGIN,
      refresh: import.meta.env.VITE_AUTH_REFRESH,
      forgotPassword: import.meta.env.VITE_AUTH_FORGOT_PASSWORD,
      resetPassword: import.meta.env.VITE_AUTH_RESET_PASSWORD,
      verifyCode: import.meta.env.VITE_AUTH_VERIFY_CODE,
      checkEmail: import.meta.env.VITE_AUTH_CHECK_EMAIL,
    },
    hotel: {
      occupancy: import.meta.env.VITE_HOTEL_OCCUPANCY,
      occupancyRange: import.meta.env.VITE_HOTEL_OCCUPANCY_RANGE,
    },
  },
  mock: {
    token: import.meta.env.VITE_MOCK_TOKEN,
    hotelId: import.meta.env.VITE_MOCK_HOTEL_ID,
    userId: import.meta.env.VITE_MOCK_USER_ID,
  },
};

export const getEndpoint = (path: string, params: Record<string, string> = {}) => {
  // Remove the /api prefix if it exists
  const cleanPath = path.startsWith('/api') ? path.substring(4) : path;
  let endpoint = cleanPath;
  
  Object.entries(params).forEach(([key, value]) => {
    endpoint = endpoint.replace(`:${key}`, value);
  });
  
  return endpoint;
};

export default config;