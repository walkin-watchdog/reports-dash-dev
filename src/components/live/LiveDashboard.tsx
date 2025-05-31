// src/components/live/LiveDashboard.tsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Dashboard1 from './Dashboard1';
import Dashboard2 from './Dashboard2';
import Loader from '../Loader';

const LiveDashboard: React.FC = () => {
  const [activeDashboard, setActiveDashboard] = useState<'RoomDashboard1' | 'RoomDashboard2'>('RoomDashboard1');
  
  const loading = useSelector((state: RootState) => state.live.loading);
  const rooms = useSelector((state: RootState) => state.main.rooms);

  if (loading && rooms.length === 0) {
    return <Loader />;
  }

  return (
    <div
      className="h-screen overflow-hidden bg-zinc-900"
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
    </div>
  );
};

export default LiveDashboard;