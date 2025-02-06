import { AuthResponse, OccupancyResponse } from '../types/api';
import { handleApiError } from '../utils/errorHandling';
import config, { getEndpoint } from '../config/api';
import { addDays, format } from 'date-fns';
import axios from 'axios';

// Hotel configurations for mock data
type SeasonalityFactors = {
  [key: number]: number;
};

interface HotelConfig {
  id: string;
  name: string;
  totalRooms: number;
  categories: Array<{
    name: string;
    count: number;
    baseOccupancy: number;
  }>;
  seasonalityFactors: SeasonalityFactors;
}

const mockHotels: Record<string, HotelConfig> = {
  hotel1: {
    id: 'hotel1',
    name: 'Luxury Resort & Spa',
    totalRooms: 22,
    categories: [
      { name: 'Presidential Suite', count: 2, baseOccupancy: 100 },
      { name: 'Executive Suite', count: 3, baseOccupancy: 50 },
      { name: 'Deluxe Ocean View', count: 4, baseOccupancy: 75 },
      { name: 'Deluxe Garden View', count: 5, baseOccupancy: 60 },
      { name: 'Standard Room', count: 8, baseOccupancy: 75 },
    ],
    seasonalityFactors: {
      0: 0.8, // January
      1: 0.85, // February
      2: 0.9, // March
      3: 0.95, // April
      4: 1.1, // May
      5: 1.2, // June
      6: 1.3, // July
      7: 1.3, // August
      8: 1.1, // September
      9: 1.0, // October
      10: 0.9, // November
      11: 1.2, // December
    },
  },
  hotel2: {
    id: 'hotel2',
    name: 'Business Hotel Downtown',
    totalRooms: 21,
    categories: [
      { name: 'Executive Suite', count: 2, baseOccupancy: 100 },
      { name: 'Business Deluxe', count: 5, baseOccupancy: 80 },
      { name: 'Business Standard', count: 6, baseOccupancy: 75 },
      { name: 'Economy Room', count: 8, baseOccupancy: 75 },
    ],
    seasonalityFactors: {
      0: 0.7, // January
      1: 0.8, // February
      2: 0.9, // March
      3: 1.1, // April
      4: 1.0, // May
      5: 0.9, // June
      6: 0.8, // July
      7: 0.8, // August
      8: 1.0, // September
      9: 1.2, // October
      10: 1.1, // November
      11: 0.7, // December
    },
  },
};

// Generate realistic check-in/out patterns
const generateTimeSlots = (date: Date, category: string) => {
  const baseCheckInHour = category.includes('Business') ? 14 : 15; // Business travelers check in earlier
  const baseCheckOutHour = category.includes('Business') ? 11 : 12;

  const checkInVariation = Math.floor(Math.random() * 4) - 2; // -2 to +1 hours
  const checkOutVariation = Math.floor(Math.random() * 4) - 2;

  const checkInHour = baseCheckInHour + checkInVariation;
  const checkOutHour = baseCheckOutHour + checkOutVariation;

  const checkInDate = new Date(date);
  checkInDate.setHours(checkInHour, 0, 0, 0);

  // Set check-out date to the next day
  const checkOutDate = new Date(date);
  checkOutDate.setDate(checkOutDate.getDate() + 1);
  checkOutDate.setHours(checkOutHour, 0, 0, 0);

  return {
    checkIn: Math.floor(checkInDate.getTime() / 1000),
    checkOut: Math.floor(checkOutDate.getTime() / 1000),
  };
};

// Generate mock occupancy data for a specific date and hotel
const generateMockOccupancyData = (date: Date, hotelConfig: HotelConfig) => {
  const month = date.getMonth();
  const seasonalityFactor = hotelConfig.seasonalityFactors[month];
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const weekendFactor = isWeekend ? 1.2 : 1.0;

  const records = [];
  let totalOccupied = 0;

  // Compute fixed per-category totals based on the hotel configuration.
  const categoryTotals: Record<string, number> = {};
  hotelConfig.categories.forEach((cat) => {
    categoryTotals[cat.name] = cat.count;
  });

  for (const category of hotelConfig.categories) {
    const baseOccupancy = category.baseOccupancy / 100;
    const adjustedOccupancy = Math.min(
      1,
      baseOccupancy *
        seasonalityFactor *
        weekendFactor *
        (0.9 + Math.random() * 0.2)
    );

    const occupiedRooms = Math.floor(category.count * adjustedOccupancy);
    totalOccupied += occupiedRooms;

    for (let i = 0; i < category.count; i++) {
      if (i < occupiedRooms) {
        let { checkIn, checkOut } = generateTimeSlots(date, category.name);
        // With 10% probability, force an error: set check-out within 30 minutes of check-in.
        if (Math.random() < 0.1) {
          const errorSeconds = 60 + Math.floor(Math.random() * (1800 - 60)); // at least 1 minute, up to 30 minutes
          checkOut = checkIn + errorSeconds;
        }

        // Compute check-in and check-out categories on the backend
        const checkInDate = new Date(checkIn * 1000);
        const checkOutDate = new Date(checkOut * 1000);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        // Determine normal check-in start time and normal check-out end time
        const normalCheckInStart = new Date(dayStart);
        normalCheckInStart.setHours(
          category.name.includes('Business') ? 14 : 15,
          0,
          0,
          0
        );
        const normalCheckOutEnd = new Date(dayStart);
        normalCheckOutEnd.setDate(normalCheckOutEnd.getDate() + 1);
        normalCheckOutEnd.setHours(
          category.name.includes('Business') ? 11 : 12,
          0,
          0,
          0
        );

        const checkInCategory =
          checkInDate < normalCheckInStart ? 'early' : 'normal';
        const checkOutCategory =
          checkOutDate > normalCheckOutEnd ? 'late' : 'normal';

        records.push({
          roomid: `${i + 1}`.padStart(4, '0'),
          room_category: category.name,
          check_in_unixstamp: checkIn,
          check_out_unixstamp: checkOut,
          last_occupancy_timestamp: checkIn,
          last_alerted: Math.random() > 0.9 ? checkIn + 3600 : null,
          checkInCategory,
          checkOutCategory,
        });
      }
    }
  }

  return {
    records,
    summary: {
      totalRooms: hotelConfig.totalRooms,
      occupiedRooms: totalOccupied,
      occupancyPercentage: Math.round(
        (totalOccupied / hotelConfig.totalRooms) * 100
      ),
      categoryTotals, // <-- Added fixed totals per category here
    },
  };
};
import { get } from 'idb-keyval';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.api.endpoint,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  const selectedHotel = localStorage.getItem('selectedHotel');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (selectedHotel) {
    config.headers['X-Hotel-Id'] = selectedHotel;
  }
  config.headers['X-User-Role'] = 'owner';
  return config;
});

/**
 * Authenticates a user with email and password
 */
export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  if (
    import.meta.env.DEV &&
    email === 'demo@example.com' &&
    password === 'demo'
  ) {
    return {
      statusCode: 200,
      body: {
        message: 'Login successful',
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature',
        user: {
          id: 'demo-user',
          emailid: email,
          hotels: [
            { id: 'hotel1', hotelname: mockHotels.hotel1.name },
            { id: 'hotel2', hotelname: mockHotels.hotel2.name },
          ],
        },
      },
    };
  }

  try {
    const response = await api.post(getEndpoint(config.endpoints.auth.login), {
      username: email,
      password: password,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const checkEmailExists = async (email: string) => {
  if (import.meta.env.DEV) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { exists: email === 'demo@example.com' };
  }

  try {
    const response = await api.post(
      getEndpoint(config.endpoints.auth.checkEmail),
      { email }
    );
    const data =
      typeof response.data.body === "string"
        ? JSON.parse(response.data.body)
        : response.data.body || response.data;

    if (data.status === "error") {
      throw new Error(data.message);
    }
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const forgotPassword = async (email: string) => {
  if (import.meta.env.DEV) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (email !== 'demo@example.com') {
      throw new Error('Email not found');
    }
    return { message: 'Verification code sent' };
  }

  try {
    const response = await api.post(
      getEndpoint(config.endpoints.auth.forgotPassword),
      { email }
    );
    const data =
      typeof response.data.body === "string"
        ? JSON.parse(response.data.body)
        : response.data.body || response.data;

    if (data.status === "error") {
      throw new Error(data.message);
    }
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const verifyCode = async (email: string, code: string) => {
  if (import.meta.env.DEV) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { valid: code === '123456' };
  }

  try {
    const response = await api.post(
      getEndpoint(config.endpoints.auth.verifyCode),
      { email, code }
    );
    const data =
      typeof response.data.body === "string"
        ? JSON.parse(response.data.body)
        : response.data.body || response.data;

    if (data.status === "error") {
      throw new Error(data.message);
    }
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
) => {
  if (import.meta.env.DEV) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
  }

  try {
    const response = await api.post(
      getEndpoint(config.endpoints.auth.resetPassword),
      {
        email,
        code,
        newPassword: newPassword,
      }
    );
    const data =
      typeof response.data.body === "string"
        ? JSON.parse(response.data.body)
        : response.data.body || response.data;

    if (data.status === "error") {
      throw new Error(data.message);
    }
    return data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves occupancy data for a specific hotel and date
 */
export const getOccupancyData = async (
  hotelId: string,
  date: string
): Promise<OccupancyResponse> => {
  if (
    import.meta.env.DEV &&
    localStorage.getItem('auth_token') ===
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature'
  ) {
    const hotelConfig = mockHotels[hotelId as keyof typeof mockHotels];
    if (!hotelConfig) {
      throw new Error('Hotel not found');
    }

    const mockData = generateMockOccupancyData(new Date(date), hotelConfig);

    return {
      statusCode: 200,
      body: {
        hotelname: hotelConfig.name,
        emailid: 'demo@example.com',
        date,
        records: mockData.records,
        summary: mockData.summary,
      },
    };
  }

  try {
    const response = await api.get(
      getEndpoint(config.endpoints.hotel.occupancy, { hotelId }),
      { params: { date } }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Retrieves occupancy data for a date range
 */
export const getOccupancyRange = async (
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<OccupancyResponse[]> => {
  if (
    import.meta.env.DEV &&
    localStorage.getItem('auth_token') ===
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature'
  ) {
    const hotelConfig = mockHotels[hotelId as keyof typeof mockHotels];
    if (!hotelConfig) {
      throw new Error('Hotel not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Array.from({ length: days + 1 }, (_, i) => {
      const currentDate = addDays(start, i);
      const mockData = generateMockOccupancyData(currentDate, hotelConfig);

      return {
        statusCode: 200,
        body: {
          hotelname: hotelConfig.name,
          emailid: 'demo@example.com',
          date: format(currentDate, 'yyyy-MM-dd'),
          records: mockData.records,
          summary: mockData.summary,
        },
      };
    });
  }

  try {
    const response = await api.get(
      getEndpoint(config.endpoints.hotel.occupancyRange, { hotelId }),
      { params: { startDate, endDate } }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
