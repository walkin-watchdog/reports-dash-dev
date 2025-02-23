export interface User {
  id: string;
  emailid: string;
  hotels: Hotel[];
}

export interface Hotel {
  id: string;
  hotelname: string;
}

export interface AuthResponse {
  statusCode: number;
  body: {
    message: string;
    token: string;
    user: User;
  };
}

export interface OccupancyRecord {
  roomid: string;
  room_category: string;
  check_in_unixstamp: number;
  check_out_unixstamp: number | null;
  last_occupancy_timestamp: number;
  last_alerted: number | null;
}

export interface OccupancySummary {
  totalRooms: number;
  occupiedRooms: number;
  occupancyPercentage: number;
}

export interface OccupancyResponse {
  statusCode: number;
  body: {
    hotelname: string;
    emailid: string;
    date: string;
    records: OccupancyRecord[];
    summary: OccupancySummary;
  };
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
}