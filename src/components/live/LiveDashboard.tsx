import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Container } from '@mui/material';
import { RootState } from '../../store';
import RoomGrid from '../RoomGrid';
import RoomSummary from '../RoomSummary';
import Dashboard1 from './Dashboard1';
import Dashboard2 from './Dashboard2';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { analytics } from '../../utils/analytics';
import { Room } from '../../types';
import { useMediaQuery, useTheme, Drawer } from '@mui/material';
import { Menu as MenuIcon } from 'lucide-react';
import Loader from '../Loader';

const LiveDashboard: React.FC = () => {
  const [activeDashboard, setActiveDashboard] = useState<'RoomDashboard1' | 'RoomDashboard2'>('RoomDashboard1');
  const [height, setHeight] = useState(0);
  const [errors] = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const loading = useSelector((state: RootState) => state.live.loading);

  const rooms = useSelector((state: RootState) => state.main.rooms);
  const labels = useSelector((state: RootState) => state.main.labels);
  const platform = useSelector((state: RootState) => state.main.platform);
  const activeLabel = useSelector((state: RootState) => state.live.activeLabel);
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

    if (loading && rooms.length === 0) {
    return <Loader />;
  }

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