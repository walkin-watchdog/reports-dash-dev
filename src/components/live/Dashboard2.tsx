// src/components/live/Dashboard2.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { formatRoomId } from '../../utils/formatRoomId';
import Loader from '../Loader';
import DashboardToggle from './DashboardToggle';
import LogoutButton from '../LogoutButton';
import { RootState } from '../../store';
import { setActiveLabel } from '../../store/slices/liveSlice';
import { toTitleCase } from '../../utils/string';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { RoomGrid } from './RoomCell';

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

interface DashboardProps {
  activeDashboard: string;
  onChangeDashboard: (dashboard: 'RoomDashboard1' | 'RoomDashboard2') => void;
}

const Dashboard2 = ({
  activeDashboard,
  onChangeDashboard,
}: DashboardProps) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | null>(null);

  // Measure react-window area
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef  = useRef<HTMLDivElement>(null);

  // Redux selectors
  const rooms = useSelector((s: RootState) => s.main.rooms);
  const platform = useSelector((s: RootState) => s.main.platform);
  const labels = useSelector((s: RootState) => s.main.labels || {});
  const activeLabel = useSelector((s: RootState) => s.live.activeLabel);

  // Initialize clock & switch off loading
  useEffect(() => {
    setDate(new Date());
    const timer = setInterval(() => {
      setDate(new Date());
    }, 10000);
    setLoading(false);
    return () => clearInterval(timer);
  }, [dispatch]);

  // Measure container on mount & resize

  const beautyDate = date
    ? {
        time: format(date, 'h:mm aa'),
        day: format(date, 'EEEE, MMMM d'),
      }
    : { time: '', day: '' };

  // Sort & filter rooms
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

  const {
      pullLoading: pullLoadingMobile,
      handleTouchStart: handleTouchStartMobile,
      handleTouchMove: handleTouchMoveMobile,
      handleTouchEnd: handleTouchEndMobile,
    } = usePullToRefresh({
      onRefresh: () => window.location.reload(),
    });

  // Sidebar summaries
  const roomLabels = useMemo(
    () =>
      Object.keys(labels)
        .map((label) => {
          const total = rooms.filter((r) => r.label === label);
          const display = toTitleCase(labels[label] ?? label);
          const occupied = rooms.filter(
            (r) => r.label === label && !r.is_inactive
          );
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
            occupied: occupied.length === total.length,
          };
        })
        .sort((a, b) => b.total - a.total),
    [labels, rooms]
  );

  const summary = useMemo(() => {
    const emptyAll = sortedRooms.every((r) => r.is_inactive);
    const occupiedAll = sortedRooms.every((r) => !r.is_inactive);
    const activeCount = sortedRooms.filter((r) => !r.is_inactive).length;
    return {
      empty: emptyAll,
      occupied: occupiedAll,
      status:
        activeCount === sortedRooms.length
          ? 'All Active'
          : activeCount > 0
          ? `${activeCount} Active`
          : 'All Inactive',
    };
  }, [sortedRooms]);

  // ─── Single “loading” guard ──────────────────────────────────────────
  if (loading) {
    return <Loader />;
  }

  // ─── SidebarContent definition (no stray return here) ────────────────
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
        {/* All Rooms summary */}
        <div className="pr-5">
          <div
            onClick={() => dispatch(setActiveLabel(null))}
            className={`hover:bg-zinc-700 flex space-x-5 items-center py-1 px-1 sm:py-3 sm:px-3 mt-1 rounded-md cursor-pointer ${
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
              {summary.empty ? (
                <svg
                  className="h-6 w-6 sm:h-9 sm:w-9 fill-zinc-800"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <title>lighting-bolt-struck</title>
                  <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z M3 6L4.5 4.5L20.5 18.5L19 20L3 6Z" />
                </svg>
              ) : (
                <svg
                  className={`${
                    summary.occupied ? 'fill-green-600' : 'fill-yellow-600'
                  } h-6 w-6 sm:h-9 sm:w-9`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <title>lighting-bolt</title>
                  <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z" />
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
                activeLabel === rtype.id ? 'bg-zinc-900' : ''
              } hover:bg-zinc-700 flex space-x-5 items-center py-1 px-1 sm:py-3 sm:px-3 mt-1 rounded-md cursor-pointer`}
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
                {rtype.empty ? (
                  <svg
                    className="h-6 w-6 sm:h-9 sm:w-9 fill-zinc-800"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <title>lighting-bolt-struck</title>
                    <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z M3 6L4.5 4.5L20.5 18.5L19 20L3 6Z" />
                  </svg>
                ) : (
                  <svg
                    className={`${
                      rtype.occupied ? 'fill-green-600' : 'fill-yellow-600'
                    } h-6 w-6 sm:h-9 sm:w-9`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <title>lighting-bolt</title>
                    <path d="M13 2L3 14H10L8 22L18 10H11L13 2Z" />
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
              </div>
            </div>
          ))}
        </div>

        {/* Toggle + Logout */}
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
  // ─── SINGLE combined return (Desktop + Mobile) ─────────────────────────
  return (
    <div className="h-screen flex flex-col">
      {/* ─── Desktop (lg:flex) ───────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1">
        <SidebarContent />

        <div
          ref={desktopRef}
          className="flex-1 h-full lg:overflow-y-auto px-6 py-4"
        >
          <RoomGrid
            rooms={displayRooms}
            mode="activity"
            platform={platform}
            containerRef={desktopRef}
          />
        </div>
      </div>

      {/* ─── Mobile (lg:hidden) ───────────────────────────────────────────── */}
      <div className="lg:hidden h-full relative overflow-hidden">
        {/* Mobile Header (labels + logout) */}
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

        {/* Mobile Toggle at bottom */}
        <div className="fixed bottom-0 bg-zinc-900 p-2 cursor-pointer z-10 w-full flex justify-center">
          <DashboardToggle
            activeDashboard={activeDashboard}
            onChangeDashboard={onChangeDashboard}
          />
        </div>

        {/* Mobile react-window Grid (2-column, 25vh) */}
        <div
          ref={mobileRef}
          className="lg:hidden p-3 overflow-y-auto h-full"
          style={{
            paddingBottom: '4.5rem',
            paddingTop: '4.5rem',
          }}
        >
          {pullLoadingMobile && (
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
            mode="activity"
            platform={platform}
            containerRef={mobileRef}
            handleTouchStart={handleTouchStartMobile}
            handleTouchMove={handleTouchMoveMobile}
            handleTouchEnd={handleTouchEndMobile}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard2;