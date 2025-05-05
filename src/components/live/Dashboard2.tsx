import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { formatRoomId } from '../../utils/formatRoomId';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import Loader from '../Loader';
import DashboardToggle from './DashboardToggle';
import LogoutButton from '../LogoutButton';
import { RootState } from '../../store';
import { setActiveLabel } from '../../store/slices/liveSlice';
import { analytics } from '../../utils/analytics';
import { Room } from '../../types';
import { toTitleCase } from '../../utils/string';

interface DashboardProps {
  activeDashboard: string;
  onChangeDashboard: (dashboard: 'RoomDashboard1' | 'RoomDashboard2') => void;
}
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const Dashboard2 = ({ activeDashboard, onChangeDashboard }: DashboardProps) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | null>(null);
  const [height, setHeight] = useState(0);
  const [errors] = useState<string[]>([]);

  const rooms = useSelector((state: RootState) => state.main.rooms);
  const platform = useSelector((state: RootState) => state.main.platform);
  const labels = useSelector((state: RootState) => state.main.labels || {});
  const activeLabel = useSelector((state: RootState) => state.live.activeLabel);

  useEffect(() => {
    const init = async () => {
      setDate(new Date());
      setInterval(() => {
        setDate(new Date());
      }, 10000);
      setLoading(false);
    };
    init();
  }, [dispatch]);

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

  const handleRoomClick = (room: Room) => {
    analytics.trackEvent('LiveDashboard', 'RoomClick', room.id);
  };

  const beautyDate = date
    ? {
        time: format(date, 'h:mm aa'),
        day: format(date, 'EEEE, MMMM d'),
      }
    : { time: '', day: '' };

    const sortedRooms = useMemo(
      () =>
        rooms
          .slice()
          .sort((a, b) =>
            collator.compare(formatRoomId(a.id), formatRoomId(b.id))
          ),
      [rooms]
    );

  const displayRooms = activeLabel
    ? sortedRooms.filter(r => r.label === activeLabel)
    : sortedRooms;

  const roomLabels = Object.keys(labels).map(label => {
    const total = rooms.filter(element => element.label === label);
    const display = toTitleCase(labels[label] ?? label);
    const occupied = rooms.filter(element => element.label === label && !element.is_inactive);
    
    let status = 'All Inactive';
    if (occupied.length === total.length) {
      status = 'All Active';
    } else if (occupied.length > 0) {
      status = `${occupied.length} Active`;
    }

    return {
      name: display,
      id: label,
      empty: occupied.length === 0,
      total: total.length,
      status,
      occupied: occupied.length === total.length
    }; }).sort((a, b) => b.total - a.total);

  const summary = {
    empty: sortedRooms.every(r => r.is_inactive),
    occupied: sortedRooms.every(r => !r.is_inactive),
    status: rooms.filter(r => !r.is_inactive).length === sortedRooms.length
      ? 'All Active'
      : sortedRooms.filter(r => !r.is_inactive).length > 0
        ? `${sortedRooms.filter(r => !r.is_inactive).length} Active`
        : 'All Inactive'
  };

  if (loading) return <Loader />;

  return (
    <div className="h-screen">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full">
        {/* Sidebar */}
        <div className={`${platform.os === 'ios' ? 'pt-20 md:pt-12' : 'pt-12'} w-1/2 sm:w-1/3 lg:w-60 xl:w-96 bg-zinc-800 text-white px-1 sm:px-5 flex flex-col h-full`}>
          <p className="text-3xl sm:text-4xl xl:text-6xl font-extralight tracking-wider">{beautyDate.time}</p>
          <div className="mt-5 text-zinc-100">{beautyDate.day}</div>
          
          <div className={`${platform.os === 'ios' ? 'pb-20 md:pb-0' : ''} flex-1 overflow-y-auto overflow-x-hidden`}>
            {/* All Rooms Summary */}
            <div className="pr-5">
              <div
                onClick={() => dispatch(setActiveLabel(null))}
                className={`hover:bg-zinc-700 flex space-x-5 items-center py-1 px-1 sm:py-3 sm:px-3 mt-1 rounded-md cursor-pointer ${activeLabel === null ? 'bg-zinc-900' : ''}`}
              >
                <span className={`${summary.empty ? 'bg-zinc-600' : summary.occupied ? 'bg-green-50' : 'bg-yellow-50'} p-1.5 rounded-full`}>
                  {summary.empty ? (
                    <svg className="h-6 w-6 sm:h-9 sm:w-9 fill-zinc-800"
                      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <title>lighting-bolt-struck</title>
                      <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z M3 6L4.5 4.5L20.5 18.5L19 20L3 6Z" />
                    </svg>
                  ) : (
                    <svg className={`${summary.occupied ? 'fill-green-600' : 'fill-yellow-600'} h-6 w-6 sm:h-9 sm:w-9`}
                      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <title>lighting-bolt</title>
                      <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z" />
                    </svg>
                  )}
                </span>
                <div className="tracking-wide text-xs sm:text-sm">
                  <h3 className="font-semibold text-zinc-200 line-clamp-1">All Rooms</h3>
                  <p className="text-zinc-400 line-clamp-1 capitalize">{summary.status}</p>
                </div>
              </div>
            </div>

            {/* Room Labels */}
            <div className="flex-1 pr-5">
              {roomLabels.map(rtype => (
                <div
                  key={rtype.id}
                  onClick={() => dispatch(setActiveLabel(rtype.id))}
                  className={`${activeLabel === rtype.id ? 'bg-zinc-900' : ''} hover:bg-zinc-700 flex space-x-5 items-center py-1 px-1 sm:py-3 sm:px-3 mt-1 rounded-md cursor-pointer`}
                >
                  <span className={`${rtype.empty ? 'bg-zinc-600' : rtype.occupied ? 'bg-green-50' : 'bg-yellow-50'} p-1.5 rounded-full`}>
                    {rtype.empty ? (
                      <svg className="h-6 w-6 sm:h-9 sm:w-9 fill-zinc-800"
                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <title>lighting-bolt-struck</title>
                        <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z M3 6L4.5 4.5L20.5 18.5L19 20L3 6Z" />
                      </svg>
                    ) : (
                      <svg className={`${rtype.occupied ? 'fill-green-600' : 'fill-yellow-600'} h-6 w-6 sm:h-9 sm:w-9`}
                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <title>lighting-bolt</title>
                        <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z" />
                      </svg>
                    )}
                  </span>
                  <div className="tracking-wide text-xs sm:text-sm">
                    <h3 className="font-semibold text-zinc-200 line-clamp-1">{rtype.name}</h3>
                    <p className="text-zinc-400 line-clamp-1">{rtype.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Toggle and Logout */}
          <div className="mt-auto py-4 flex flex-col items-center space-y-2">
            <DashboardToggle
              activeDashboard={activeDashboard}
              onChangeDashboard={onChangeDashboard}
            />
            <div className="w-full px-2">
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Room Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className={`${platform.os === 'ios' ? 'pt-20 pb-20 md:pb-0 sm:pt-0' : ''} sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 grid grid-cols-1 gap-3`}>
            {displayRooms.map((room, ridx) => (
              <div
                key={ridx}
                className="grid-item"
                style={{ height: `${height}px` }}
              >
                <button
                  className={`${room.is_inactive ? 'bg-zinc-800' : 'bg-white'} rounded-3xl h-full w-full overflow-hidden relative`}
                >
                  {room.is_inactive ? (
                    <svg className="absolute top-10 sm:top-5 lg:top-10 left-6 h-1/3 w-auto fill-white"
                      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <title>lighting-bolt-struck</title>
                      <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z M3 6L4.5 4.5L20.5 18.5L19 20L3 6Z" />
                    </svg>
                  ) : (
                    <svg className="absolute top-10 sm:top-5 lg:top-10 left-6 h-1/3 w-auto fill-red-600"
                      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <title>lighting-bolt</title>
                      <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z" />
                    </svg>
                  )}
                  <div className={`${room.is_inactive ? 'text-zinc-400' : 'text-zinc-600'} absolute left-0 bottom-5 sm:bottom-4 lg:bottom-5 w-full text-sm md:text-base lg:text-xl font-semibold pl-6 sm:pl-2 lg:pl-6 tracking-wide text-left text-wrap`}>
                    <span className="mr-2">{formatRoomId(room.id)}</span>
                    <span>{room.is_inactive ? 'Inactive' : 'Active'}</span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden h-full relative overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center space-x-3 bg-zinc-900 overflow-x-auto text-white p-2 fixed top-0 z-20 w-full">
          <div className="flex-1 flex items-center space-x-3 overflow-x-auto">
            <div
              className={`flex-shrink-0 py-2 px-4 rounded-md cursor-pointer bg-zinc-700 ${
                activeLabel === null ? 'bg-zinc-900' : ''
              }`}
              onClick={() => dispatch(setActiveLabel(null))}
            >
              All Rooms
            </div>
            {roomLabels.map(rtype => (
              <div
                key={rtype.id}
                className={`flex-shrink-0 py-2 px-4 rounded-md cursor-pointer bg-zinc-700 ${
                  activeLabel === rtype.id ? 'bg-zinc-900' : ''
                }`}
                onClick={() => dispatch(setActiveLabel(rtype.id))}
              >
                {rtype.name}
              </div>
            ))}
          </div>
          <div className="flex-shrink-0">
            <LogoutButton isMobile />
          </div>
        </div>

        {/* Mobile toggle */}
        <div className="fixed bottom-0 bg-zinc-900 p-2 cursor-pointer z-10 w-full flex justify-center">
          <DashboardToggle
            activeDashboard={activeDashboard}
            onChangeDashboard={onChangeDashboard}
          />
        </div>

        {/* Mobile grid */}
        <div
          className="p-3 overflow-y-auto h-full"
          style={{
            paddingBottom: '4.5rem',
            paddingTop: '4.5rem'
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            {displayRooms.map((room, ridx) => (
              <div
                key={ridx}
                style={{ height: '25vh' }}
                className="grid-item relative"
              >
                <button
                  className={`${room.is_inactive ? 'bg-zinc-800' : 'bg-white'} rounded-3xl h-full w-full overflow-hidden relative`}
                >
                  {room.is_inactive ? (
                    <svg
                      className="absolute top-6 left-4 h-1/3 w-auto fill-white"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <title>lighting-bolt-struck</title>
                      <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z M3 6L4.5 4.5L20.5 18.5L19 20L3 6Z" />
                    </svg>
                  ) : (
                    <svg
                      className="absolute top-6 left-4 h-1/3 w-auto fill-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <title>lighting-bolt</title>
                      <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z" />
                    </svg>
                  )}
                  <div
                    className={`${
                      room.is_inactive ? 'text-zinc-400' : 'text-zinc-600'
                    } absolute left-4 bottom-4 text-sm font-semibold text-left text-wrap`}
                  >
                    <span className="mr-2">{formatRoomId(room.id)}</span>
                    <span>{room.is_inactive ? 'Inactive' : 'Active'}</span>
                  </div>
                  {errors.includes(room.id) && (
                    <>
                      <div className="absolute top-0 left-0 h-full w-full bg-red-500 opacity-10" />
                      <div className="absolute top-4 right-4">
                        <div className="mx-auto flex flex-shrink-0 items-center justify-center rounded-full bg-red-100 p-1.5">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-600" aria-hidden="true" />
                        </div>
                      </div>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard2;