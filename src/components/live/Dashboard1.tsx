// src/components/live/Dashboard1.tsx
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { formatRoomId } from '../../utils/formatRoomId';
import Confirm from '../Confirm';
import Loader from '../Loader';
import DashboardToggle from './DashboardToggle';
import LogoutButton from '../LogoutButton';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { RootState } from '../../store';
import { setActiveLabel } from '../../store/slices/liveSlice';
import { analytics } from '../../utils/analytics';
import { Room } from '../../types';
import { toTitleCase } from '../../utils/string';
import { WebSocketService } from '../../services/websocket';
import { RoomGrid } from './RoomCell';

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

interface DashboardProps {
  activeDashboard: string;
  onChangeDashboard: (dashboard: 'RoomDashboard1' | 'RoomDashboard2') => void;
}

const Dashboard1 = ({
  activeDashboard,
  onChangeDashboard,
}: DashboardProps) => {
  const dispatch = useDispatch();

  // ─── 1) Loading / Confirmation state ─────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [shouldConfirm, setShouldConfirm] = useState(false);
  const [nextRoom, setNextRoom] = useState<string | null>(null);
  const [nextState, setNextState] = useState<boolean | null>(null);

  // ─── 2) Clock state ───────────────────────────────────────────────────────
  const [date, setDate] = useState<Date | null>(null);

  // ─── 3) Measure react-window container ───────────────────────────────────
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef  = useRef<HTMLDivElement>(null);
  
  // ─── 4) Pull-to-refresh (mobile) ─────────────────────────────────────────
  const {
    pullLoading,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = usePullToRefresh({
    onRefresh: () => window.location.reload(),
  });

  // ─── 5) Redux selectors ──────────────────────────────────────────────────
  const rooms = useSelector((s: RootState) => s.main.rooms);
  const platform = useSelector((s: RootState) => s.main.platform);
  const labels = useSelector((s: RootState) => s.main.labels || {});
  const activeLabel = useSelector(
    (s: RootState) => s.live.activeLabel
  );
  const errors = useSelector((s: RootState) => s.live.error || []);

  // ─── 6) Initialize clock & stop loading ──────────────────────────────────
  useEffect(() => {
    setDate(new Date());
    const timer = setInterval(() => {
      setDate(new Date());
    }, 10000);
    setLoading(false);

    return () => clearInterval(timer);
  }, [dispatch]);

  // ─── 8) Click / Confirm logic ─────────────────────────────────────────────
  const handleRoomClick = (room: Room) => {
    setNextRoom(room.id);
    setNextState(!room.is_vacant);
    setShouldConfirm(true);
    analytics.trackEvent('LiveDashboard', 'RoomClick', room.id);
  };

  const confirmState = async (status: boolean) => {
    setShouldConfirm(false);
    if (!status) {
      setNextState(null);
      setNextRoom(null);
      return;
    }
    const ws = WebSocketService.getInstance();
    ws.sendRoomUpdate({
      id: nextRoom!,
      is_vacant: nextState!,
    });
    setNextState(null);
    setNextRoom(null);
  };

  // ─── 9) Date formatting ───────────────────────────────────────────────────
  const beautyDate = date
    ? {
        time: format(date, 'h:mm aa'),
        day: format(date, 'EEEE, MMMM d'),
      }
    : { time: '', day: '' };

  // ─── 10) Sort & filter rooms ─────────────────────────────────────────────
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
    ? sortedRooms.filter((r) => r.label === activeLabel)
    : sortedRooms;

  // ─── 11) Build a Set of errors for O(1) lookups ─────────────────────────

  // ─── 12) Sidebar summaries (unchanged) ──────────────────────────────────
  const roomLabels = useMemo(
    () =>
      Object.keys(labels)
        .map((label) => {
          const total = rooms.filter((r) => r.label === label);
          const display = toTitleCase(labels[label] ?? label);
          const occupied = rooms.filter(
            (r) => r.label === label && !r.is_vacant
          );
          const active = rooms.filter(
            (r) => r.label === label && !r.is_inactive
          );

          let status = 'All Vacant';
          if (occupied.length === total.length) {
            status = 'All Occupied';
          } else if (occupied.length > 0) {
            status = `${occupied.length} Occupied`;
          }

          let activity = 'All Inactive';
          if (active.length === total.length) {
            activity = 'All Active';
          } else if (active.length > 0) {
            activity = `${active.length} Active`;
          }

          return {
            name: display,
            id: label,
            total: total.length,
            status,
            activity,
            empty: occupied.length === 0,
            occupied: occupied.length === total.length,
            occupancy: occupied.length,
            activity_count: active.length,
            showRed: active.length > occupied.length,
          };
        })
        .sort((a, b) => b.total - a.total),
    [labels, rooms]
  );

  const summary = useMemo(() => {
    const emptyAll = sortedRooms.every((r) => r.is_vacant);
    const occupiedAll = sortedRooms.every((r) => !r.is_vacant);
    const occupiedCount = sortedRooms.filter((r) => !r.is_vacant).length;
    const activeCount = sortedRooms.filter((r) => !r.is_inactive).length;
    return {
      empty: emptyAll,
      occupied: occupiedAll,
      status:
        occupiedCount === sortedRooms.length
          ? 'All Occupied'
          : occupiedCount > 0
          ? `${occupiedCount} Occupied`
          : 'All Vacant',
      activity:
        activeCount === sortedRooms.length
          ? 'All Active'
          : activeCount > 0
          ? `${activeCount} Active`
          : 'All Inactive',
      activity_count: activeCount,
      occupancy: occupiedCount,
    };
  }, [sortedRooms]);

  // ─── 13) Compute react-window cell size & counts ─────────────────────────

  // ─── 14) Memoize click handler to keep stable reference ─────────────────
  const handleRoomClickBinding = useCallback(
    (room: Room) => handleRoomClick(room),
    [/* no deps */]
  );

  if (loading) {
    return <Loader />;
  }

  // ─── 15) SidebarContent definition ──────────────────────────────────────
  const SidebarContent = () => (
    <div
      className={`${
        platform.os === 'ios' ? 'pt-20 md:pt-12' : 'pt-12'
      } w-1/2 sm:w-1/3 lg:w-60 xl:w-96 bg-zinc-800 text-white px-1 sm:px-5 flex flex-col h-full`}
    >
      <p className="text-3xl sm:text-4xl xl:text-6xl font-extralight tracking-wider">
        {beautyDate.time}
      </p>
      <div className="mt-5 text-zinc-100">{beautyDate.day}</div>

      <div
        className={`${
          platform.os === 'ios' ? 'pb-20 md:pb-0' : ''
        } flex-1 overflow-y-auto overflow-x-hidden`}
      >
        {/* All Rooms summary tile */}
        <div className="pr-5">
          <div
            onClick={() => dispatch(setActiveLabel(null))}
            className={`${
              !platform.is_touch ? 'hover:bg-zinc-700' : ''
            } flex space-x-5 items-center py-1 px-1 sm:py-3 sm:px-3 mt-1 rounded-md cursor-pointer ${
              activeLabel === null ? 'bg-zinc-900' : ''
            }`}
          >
            <span
              className={`${
                summary.empty
                  ? 'bg-zinc-600'
                  : summary.occupied
                  ? 'bg-green-50'
                  : 'bg-yellow-50'
              } p-1.5 rounded-full`}
            >
              {summary.activity_count > summary.occupancy &&
              summary.activity_count > 0 ? (
                <svg
                  className="h-6 w-6 sm:h-9 sm:w-9 fill-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <title>lighting-bolt</title>
                  <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z" />
                </svg>
              ) : summary.empty ? (
                <svg
                  className="h-6 w-6 sm:h-9 sm:w-9 fill-zinc-800"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <title>bed-empty</title>
                  <path d="M19,7H5V14H3V5H1V20H3V17H21V20H23V11A4,4 0 0,0 19,7" />
                </svg>
              ) : (
                <svg
                  className={`${
                    summary.occupied ? 'fill-green-600' : 'fill-yellow-600'
                  } h-6 w-6 sm:h-9 sm:w-9`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <title>bed</title>
                  <path d="M19,7H11V14H3V5H1V20H3V17H21V20H23V11A4,4 0 0,0 19,7M7,13A3,3 0 0,0 10,10A3,3 0 0,0 7,7A3,3 0 0,0 4,10A3,3 0 0,0 7,13Z" />
                </svg>
              )}
            </span>
            <div className="tracking-wide text-xs sm:text-sm">
              <h3 className="font-semibold text-zinc-200 line-clamp-1">
                All Rooms
              </h3>
              <p className="text-zinc-400 line-clamp-1 capitalize">
                {summary.status}
              </p>
              <p className="text-zinc-400 line-clamp-1">
                {summary.activity}
              </p>
            </div>
          </div>
        </div>

        {/* Room Labels */}
        <div className="flex-1 pr-5">
          {roomLabels.map((rtype) => (
            <div
              key={rtype.id}
              onClick={() => dispatch(setActiveLabel(rtype.id))}
              className={`${
                !platform.is_touch ? 'hover:bg-zinc-700' : ''
              } ${
                activeLabel === rtype.id ? 'bg-zinc-900' : ''
              } flex space-x-5 items-center py-1 px-1 sm:py-3 sm:px-3 mt-1 rounded-md cursor-pointer`}
            >
              <span
                className={`${
                  rtype.empty
                    ? 'bg-zinc-600'
                    : rtype.occupied
                    ? 'bg-green-50'
                    : 'bg-yellow-50'
                } p-1.5 rounded-full`}
              >
                {rtype.activity_count > rtype.occupancy &&
                rtype.activity_count > 0 ? (
                  <svg
                    className="h-6 w-6 sm:h-9 sm:w-9 fill-red-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <title>lighting-bolt</title>
                    <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z" />
                  </svg>
                ) : rtype.empty ? (
                  <svg
                    className="h-6 w-6 sm:h-9 sm:w-9 fill-zinc-800"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <title>bed-empty</title>
                    <path d="M19,7H5V14H3V5H1V20H3V17H21V20H23V11A4,4 0 0,0 19,7" />
                  </svg>
                ) : (
                  <svg
                    className={`${
                      rtype.occupied ? 'fill-green-600' : 'fill-yellow-600'
                    } h-6 w-6 sm:h-9 sm:w-9`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <title>bed</title>
                    <path d="M19,7H11V14H3V5H1V20H3V17H21V20H23V11A4,4 0 0,0 19,7M7,13A3,3 0 0,0 10,10A3,3 0 0,0 7,7A3,3 0 0,0 4,10A3,3 0 0,0 7,13Z" />
                  </svg>
                )}
              </span>
              <div className="tracking-wide text-xs sm:text-sm">
                <h3 className="font-semibold text-zinc-200 line-clamp-1">
                  {rtype.name}
                </h3>
                <p className="text-zinc-400 line-clamp-1">
                  {rtype.status}
                </p>
                <p className="text-zinc-400 line-clamp-1">
                  {rtype.activity}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Toggle + Logout at bottom */}
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
    </div>
  );

  // ─── 16) Single combined return (Desktop + Mobile) ───────────────────────
  return (
    <div className="h-screen flex flex-col">
      {shouldConfirm && (
        <Confirm
          isVacant={nextState || false}
          room={nextRoom || ''}
          onClose={confirmState}
        />
      )}

      {/* ─── Desktop Layout (lg and up) ──────────────────────────────────── */}
      <div className="hidden lg:flex flex-1">
        {/* Sidebar */}
        <SidebarContent />

        {/* react-window <Grid> */}
        <div ref={desktopRef} className="flex-1 h-full lg:overflow-y-auto px-6 py-4">
          <RoomGrid
            rooms={displayRooms}
            mode="occupancy"
            platform={platform}
            onRoomClick={handleRoomClickBinding}
            errors={errors}
            containerRef={desktopRef}
          />
        </div>
      </div>

      {/* ─── Mobile Layout (lg:hidden) ────────────────────────────────────── */}
      <div className="lg:hidden h-full relative overflow-hidden">
        {/* Mobile Header with labels */}
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
            {roomLabels.map((rtype) => (
              <div
                key={rtype.id}
                className={`flex-shrink-0 py-2 px-4 rounded-md cursor-pointer bg-zinc-700 ${
                  activeLabel === rtype.id ? 'bg-zinc-900' : ''
                } ${rtype.showRed ? 'text-red-500' : ''}`}
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

        {/* Mobile Toggle */}
        <div className="fixed bottom-0 bg-zinc-900 p-2 cursor-pointer z-10 w-full flex justify-center">
          <DashboardToggle
            activeDashboard={activeDashboard}
            onChangeDashboard={onChangeDashboard}
          />
        </div>

        {/* Mobile react-window Grid: two columns, each cell 25vh tall */}
        <div
          ref={mobileRef}
          className="lg:hidden p-3 overflow-y-auto h-full"
          style={{
            paddingBottom: '4.5rem',
            paddingTop: '4.5rem',
          }}
        >
          {pullLoading && (
            <div className="flex items-center justify-center text-white text-sm py-2">
              <svg
                className="animate-spin h-5 w-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span>Refreshing…</span>
            </div>
          )}
          <RoomGrid
            rooms={displayRooms}
            mode="occupancy"
            platform={platform}
            onRoomClick={handleRoomClickBinding}
            errors={errors}
            containerRef={mobileRef}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard1;