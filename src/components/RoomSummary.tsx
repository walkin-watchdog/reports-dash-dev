import { Room } from '../types';
import { roomSummaryStyles as styles } from './styles/RoomSummary.styles';

interface RoomSummaryProps {
  rooms: Room[];
  label: string | null;
  name?: string;
  onClick: () => void;
  isActive: boolean;
  platform?: { is_touch: boolean };
}

const RoomSummary = ({ 
  rooms, 
  label, 
  name = 'All Rooms', 
  onClick, 
  isActive,
  platform = { is_touch: false }
}: RoomSummaryProps) => {
  const filteredRooms = label 
    ? rooms.filter(room => room.label === label)
    : rooms;

  const occupied = filteredRooms.filter(room => !room.is_vacant).length;
  const active = filteredRooms.filter(room => !room.is_inactive).length;
  const total = filteredRooms.length;

  const status = occupied === total 
    ? 'All Occupied' 
    : occupied > 0 
      ? `${occupied} Occupied` 
      : 'All Vacant';

  const activity = active === total
    ? 'All Active'
    : active > 0
      ? `${active} Active`
      : 'All Inactive';

  const empty = occupied === 0;
  const fullyOccupied = occupied === total;
  const showAlert = active > occupied && active > 0;

  return (
    <div
      onClick={onClick}
      className={styles.container(isActive, platform.is_touch)}
    >
      <span className={styles.iconWrapper(empty, fullyOccupied)}>
        {showAlert ? (
          <svg className={styles.icon('alert')} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <title>lighting-bolt</title>
            <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z" />
          </svg>
        ) : empty ? (
          <svg className={styles.icon('empty')} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <title>bed-empty</title>
            <path d="M19,7H5V14H3V5H1V20H3V17H21V20H23V11A4,4 0 0,0 19,7" />
          </svg>
        ) : (
          <svg className={styles.icon('occupied', fullyOccupied)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <title>bed</title>
            <path d="M19,7H11V14H3V5H1V20H3V17H21V20H23V11A4,4 0 0,0 19,7M7,13A3,3 0 0,0 10,10A3,3 0 0,0 7,7A3,3 0 0,0 4,10A3,3 0 0,0 7,13Z" />
          </svg>
        )}
      </span>
      <div className={styles.content}>
        <h3 className={styles.title}>{name}</h3>
        <p className={styles.status}>{status}</p>
        <p className={styles.activity}>{activity}</p>
      </div>
    </div>
  );
};

export default RoomSummary;