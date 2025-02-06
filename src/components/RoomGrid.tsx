import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Room } from '../types';
import { roomGridStyles as styles } from './styles/RoomGrid.styles';

interface RoomGridProps {
  rooms: Room[];
  height: number;
  platform: { os: string };
  onRoomClick?: (room: Room) => void;
  errors?: string[];
}

const RoomGrid = ({ rooms, height, platform, onRoomClick, errors = [] }: RoomGridProps) => {
  return (
    <div className={styles.container(platform)}>
      <div className={styles.grid(platform)}>
        {rooms.map((room, ridx) => (
          <div
            key={ridx}
            className="grid-item"
            style={{ height: `${height}px` }}
          >
            <button
              onClick={() => onRoomClick?.(room)}
              className={styles.button(room.is_vacant, room.is_inactive)}
            >
              {room.is_inactive ? (
                <svg className={`${styles.icon} fill-white`}
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <title>lighting-bolt-struck</title>
                  <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z M3 6L4.5 4.5L20.5 18.5L19 20L3 6Z" />
                </svg>
              ) : (
                <svg className={`${styles.icon} fill-red-600`}
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <title>lighting-bolt</title>
                  <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z" />
                </svg>
              )}
              {room.is_inactive ? (
                <svg className={`${styles.statusIcon} fill-gray-400`}
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <title>lighting-bolt-struck</title>
                  <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z M3 6L4.5 4.5L20.5 18.5L19 20L3 6Z" />
                </svg>
              ) : (
                <svg className={`${styles.statusIcon} fill-yellow-600`}
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <title>lighting-bolt</title>
                  <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z" />
                </svg>
              )}
              <div className={styles.text(room.is_vacant, room.is_inactive, errors.includes(room.id))}>
                <span className="mr-2 text-lg sm:text-xl lg:text-2xl">{room.id}</span>
                <span className="text-lg sm:text-xl lg:text-2xl">{room.is_vacant ? 'Vacant' : 'Occupied'}</span>
              </div>
              {(errors.includes(room.id) || (room.is_vacant && !room.is_inactive)) && (
                <div className={styles.errorOverlay} />
              )}
              {errors.includes(room.id) && (
                <div className={styles.errorIcon.wrapper}>
                  <div className={styles.errorIcon.container}>
                    <ExclamationTriangleIcon className={styles.errorIcon.icon} aria-hidden="true" />
                  </div>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomGrid;