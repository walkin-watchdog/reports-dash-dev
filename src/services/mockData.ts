import { Room } from '../types';
import { format } from 'date-fns';

interface MockRoom {
  id: string;
  is_vacant: boolean;
  label: string;
  is_inactive: boolean;
  last_update?: string;
  error?: boolean;
}

const generateMockRooms = (hotelId: string): MockRoom[] => {
  const mockData = {
    hotel1: {
      categories: [
        { name: 'premium', count: 4, baseOccupancy: 75 },
        { name: 'standard', count: 4, baseOccupancy: 60 },
        { name: 'suite', count: 2, baseOccupancy: 90 },
      ],
    },
    hotel2: {
      categories: [
        { name: 'premium', count: 3, baseOccupancy: 80 },
        { name: 'standard', count: 5, baseOccupancy: 70 },
        { name: 'suite', count: 2, baseOccupancy: 85 },
      ],
    },
  };

  const hotelConfig = mockData[hotelId as keyof typeof mockData];
  if (!hotelConfig) {
    throw new Error('Invalid hotel ID');
  }

  const rooms: MockRoom[] = [];
  let roomNumber = 101;

  hotelConfig.categories.forEach(category => {
    for (let i = 0; i < category.count; i++) {
      const isVacant = Math.random() > (category.baseOccupancy / 100);
      const isInactive = Math.random() < 0.1; // 10% chance of being inactive
      
      rooms.push({
        id: roomNumber.toString(),
        is_vacant: isVacant,
        label: category.name,
        is_inactive: isInactive,
        last_update: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        error: Math.random() < 0.05, // 5% chance of error
      });
      
      roomNumber++;
    }
  });

  return rooms;
};

export const generateMockLiveData = (hotelId: string) => {
  const rooms = generateMockRooms(hotelId);
  const labels = {
    premium: 'Premium',
    standard: 'Standard',
    suite: 'Suite',
  };

  return {
    rooms,
    labels,
  };
};

export const generateMockRoomUpdate = (room: Room): Room => {
  return {
    ...room,
    is_vacant: !room.is_vacant,
    last_update: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  };
};