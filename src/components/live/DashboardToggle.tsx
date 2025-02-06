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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={toggleStyles.icon(isDashboard1)}>
          <path
            d="M19,7H5V14H3V5H1V20H3V17H21V20H23V11A4,4 0 0,0 19,7M7,13A3,3 0 0,0 10,10A3,3 0 0,0 7,7A3,3 0 0,0 4,10A3,3 0 0,0 7,13Z"
            className={toggleStyles.iconPath(isDashboard1)}
          />
        </svg>
      </div>
      <div
        onClick={() => onChangeDashboard('RoomDashboard2')}
        className={toggleStyles.button(!isDashboard1)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={toggleStyles.icon(!isDashboard1)}>
          <path
            d="M13 2L3 14H10L8 22L18 10H11L13 2Z"
            className={toggleStyles.iconPath(!isDashboard1)}
          />
        </svg>
      </div>
      <div
        onClick={handleReportsClick}
        className={toggleStyles.button(false)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={toggleStyles.icon(false)}>
          <path
            d="M14 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2M18 20H6V4H13V9H18V20M8 12V14H16V12H8M8 16V18H13V16H8"
            className={toggleStyles.iconPath(false)}
          />
        </svg>
      </div>
    </div>
  );
};

export default DashboardToggle;