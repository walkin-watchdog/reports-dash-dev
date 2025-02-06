import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Container } from '@mui/material';
import { WebSocketService } from '../../services/websocket';
import { generateMockLiveData, generateMockRoomUpdate } from '../../services/mockData';
import { CacheStorage } from '../../services/cacheStorage';
import { RootState } from '../../store';
import { setRooms, setLabels, updateRoom } from '../../store/slices/liveSlice';
import RoomGrid from '../RoomGrid';
import RoomSummary from '../RoomSummary';
import DashboardToggle from './DashboardToggle';
import Dashboard1 from './Dashboard1';
import Dashboard2 from './Dashboard2';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { analytics } from '../../utils/analytics';
import { Room } from '../../types';
import { useMediaQuery, useTheme, Drawer } from '@mui/material';
import { Menu as MenuIcon } from 'lucide-react';

const LiveDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const [activeDashboard, setActiveDashboard] = useState<'RoomDashboard1' | 'RoomDashboard2'>('RoomDashboard1');
  const [height, setHeight] = useState(0);
  const [errors] = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const rooms = useSelector((state: RootState) => state.live.rooms);
  const labels = useSelector((state: RootState) => state.live.labels);
  const platform = useSelector((state: RootState) => state.main.platform);
  const activeLabel = useSelector((state: RootState) => state.live.activeLabel);
  const selectedHotel = useSelector((state: RootState) => state.auth.selectedHotel);
  const cache = CacheStorage.getInstance();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { containerRef, pullLoading, handleTouchStart, handleTouchMove, handleTouchEnd } =
    usePullToRefresh({
      onRefresh: () => {
        window.location.reload();
        analytics.trackEvent('LiveDashboard', 'PullToRefresh');
      },
    });

  useEffect(() => {
    const ws = WebSocketService.getInstance();
    
    // In development mode, use mock data
    if (import.meta.env.DEV) {
      const initializeMockData = async () => {
        if (!selectedHotel) return;

        // Try to get data from cache first
        const cachedRooms = await cache.getRooms(selectedHotel);
        const cachedLabels = await cache.getLabels();
        let mockData: { rooms: Room[]; labels: Record<string, string> };
        if (cachedRooms && cachedLabels) {
          mockData = { rooms: cachedRooms, labels: cachedLabels };
          dispatch(setRooms(cachedRooms));
          dispatch(setLabels(cachedLabels));
        } else {
          mockData = generateMockLiveData(selectedHotel);
          dispatch(setRooms(mockData.rooms));
          dispatch(setLabels(mockData.labels));
          
          // Cache the mock data
          await cache.setRooms(selectedHotel, mockData.rooms);
          await cache.setLabels(mockData.labels);
        }

        // Simulate periodic updates
          const updateInterval = setInterval(() => {
            const rooms = mockData.rooms;
            if (rooms.length > 0) {
              const randomIndex = Math.floor(Math.random() * rooms.length);
              const updatedRoom = generateMockRoomUpdate(rooms[randomIndex]);
              dispatch(updateRoom(updatedRoom));
            }
          }, 5000);

        return () => clearInterval(updateInterval);
      };

      initializeMockData();
    } else {
      // Production mode: use WebSocket
      ws.connect();
    }

    const unsubscribe = ws.subscribe((message) => {
      switch (message.type) {
        case 'INITIAL_DATA':
          dispatch(setRooms(message.payload.rooms));
          dispatch(setLabels(message.payload.labels));
          break;
        case 'ROOM_UPDATE':
          dispatch(updateRoom(message.payload as Room));
          break;
      }
    });

    return () => {
      if (!import.meta.env.DEV) {
        unsubscribe();
        ws.disconnect();
      }
    };
  }, [dispatch, selectedHotel]);

  useEffect(() => {
    const updateGridItemSize = () => {
      const firstGridItem = document.querySelector('.grid-item');
      if (firstGridItem) {
        setHeight(firstGridItem.clientWidth);
      }
    };
    updateGridItemSize();
    window.addEventListener('resize', updateGridItemSize);
    return () => window.removeEventListener('resize', updateGridItemSize);
  }, [rooms]);

  const displayRooms = activeLabel
    ? rooms.filter(room => room.label === activeLabel)
    : rooms;

  // Sidebar content component
  const SidebarContent = () => (
    <Box className="w-60 flex-shrink-0 bg-zinc-800 p-4 h-full">
      <RoomSummary
        rooms={rooms}
        label={null}
        name="All Rooms"
        onClick={() => {}}
        isActive={!activeLabel}
        platform={platform}
      />
      {Object.entries(labels).map(([label, name]) => (
        <RoomSummary
          key={label}
          rooms={rooms.filter(room => room.label === label)}
          label={label}
          name={name}
          onClick={() => {}}
          isActive={activeLabel === label}
          platform={platform}
        />
      ))}
    </Box>
  );

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-hidden bg-zinc-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {activeDashboard === 'RoomDashboard1' ? (
        <Dashboard1
          activeDashboard={activeDashboard}
          onChangeDashboard={setActiveDashboard}
        />
      ) : (
        <Dashboard2
          activeDashboard={activeDashboard}
          onChangeDashboard={setActiveDashboard}
        />
      )}

      {pullLoading && (
        <div className="fixed top-0 left-0 right-0 bg-zinc-800 text-white p-2 text-center">
          Pull to refresh...
        </div>
      )}

      <Container maxWidth="xl" className="h-full py-4">
        <Box className="flex h-full">
          {/* Desktop Sidebar */}
          {!isMobile && <SidebarContent />}

          {/* Main Content */}
          <Box className={`flex-1 ${!isMobile ? 'pl-4' : ''}`}>
            <RoomGrid
              rooms={displayRooms}
              height={height}
              platform={platform}
              errors={errors}
            />
          </Box>
        </Box>
      </Container>
    </div>
  );
}

export default LiveDashboard;