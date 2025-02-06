import { ApiError } from '../types/api';

export class AppError extends Error {
  constructor(
    public message: string,
    public code: number = 500,
    public timestamp: string = new Date().toISOString()
  ) {
    super(message);
    this.name = 'AppError';
  }

  static fromApiError(error: ApiError): AppError {
    return new AppError(error.message, error.statusCode, error.timestamp);
  }

  static isApiError(error: any): error is ApiError {
    return error && typeof error === 'object' && 'statusCode' in error && 'message' in error;
  }
}

export const handleApiError = (error: unknown): AppError => {
  // In development with demo token, provide more detailed errors
  if (import.meta.env.DEV && localStorage.getItem('auth_token') === 'demo-token') {
    console.error('Demo mode error:', error);
  }

  if (AppError.isApiError(error)) {
    return AppError.fromApiError(error);
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError('An unexpected error occurred');
};

export const isTokenExpired = (token: string): boolean => {
  // Demo token never expires in development
  if (import.meta.env.DEV && token === 'demo-token') {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const isTokenNearExpiry = (token: string, thresholdMinutes: number = 5): boolean => {
  // Demo token never expires in development
  if (import.meta.env.DEV && token === 'demo-token') {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now() + thresholdMinutes * 60 * 1000;
  } catch {
    return true;
  }
};