import { get, set, del } from 'idb-keyval';
import { Room } from '../types';

interface CacheConfig {
  version: string;
  timestamp: number;
  ttl: number;
}

interface CachedData<T> {
  data: T;
  config: CacheConfig;
}

class CacheStorage {
  private static instance: CacheStorage;
  private readonly VERSION = '1.0.0';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): CacheStorage {
    if (!CacheStorage.instance) {
      CacheStorage.instance = new CacheStorage();
    }
    return CacheStorage.instance;
  }

  private createCacheConfig(ttl?: number): CacheConfig {
    return {
      version: this.VERSION,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    };
  }

  private isExpired(config: CacheConfig): boolean {
    return Date.now() - config.timestamp > config.ttl;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const cachedData: CachedData<T> = {
      data,
      config: this.createCacheConfig(ttl),
    };
    await set(key, cachedData);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await get<CachedData<T>>(key);
      if (!cachedData) return null;

      // Version check
      if (cachedData.config.version !== this.VERSION) {
        await this.remove(key);
        return null;
      }

      // TTL check
      if (this.isExpired(cachedData.config)) {
        await this.remove(key);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await del(key);
  }

  async getRooms(hotelId: string): Promise<Room[] | null> {
    return this.get<Room[]>(`rooms_${hotelId}`);
  }

  async setRooms(hotelId: string, rooms: Room[]): Promise<void> {
    await this.set(`rooms_${hotelId}`, rooms);
  }

  async getLabels(): Promise<Record<string, string> | null> {
    return this.get<Record<string, string>>('room_labels');
  }

  async setLabels(labels: Record<string, string>): Promise<void> {
    await this.set('room_labels', labels);
  }
}

export { CacheStorage }