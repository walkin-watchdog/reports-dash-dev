import { toggleStyles } from '../styles/DashboardToggle.styles';
import { useNavigate } from 'react-router-dom';

interface DashboardToggleProps {
  activeDashboard: string;
  onChangeDashboard: (dashboard: 'RoomDashboard1' | 'RoomDashboard2') => void;
}

const DashboardToggle = ({ activeDashboard, onChangeDashboard }: DashboardToggleProps) => {
  const isDashboard1 = activeDashboard === 'RoomDashboard1';
  const navigate = useNavigate();

  const handleReportsClick = () => {
    navigate('/');
  };

  return (
    <div className={toggleStyles.container}>
      <div className={toggleStyles.slider(activeDashboard === 'RoomDashboard1' ? 0 : 1)} />
      <div
        onClick={() => onChangeDashboard('RoomDashboard1')}
        className={toggleStyles.button(isDashboard1)}
      >
        {/* ... existing code ... */}
      </div>
      <div
        onClick={() => onChangeDashboard('RoomDashboard2')}
        className={toggleStyles.button(!isDashboard1)}
      >
        {/* ... existing code ... */}
      </div>
      <div
        onClick={handleReportsClick}
        className={toggleStyles.button(false)}
      >
        {/* ... existing code ... */}
      </div>
    </div>
  );
};

export default DashboardToggle;