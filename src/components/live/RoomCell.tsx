// src/components/live/RoomCell.tsx
import React, {
  useRef,
  useState,
  useEffect,
  CSSProperties,
  useMemo,
} from 'react';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { formatRoomId } from '../../utils/formatRoomId';
import { mergeRefs } from 'react-merge-refs';
import CellErrorBoundary from './CellErrorBoundary';
import { roomCellStyles as styles } from '../styles/RoomCell.styles';
import { Room } from '../../types';
import { useApp } from '../../hooks/useApp';

/* ------------------------------------------------------------------ */
/*  1. SINGLE-CELL IMPLEMENTATION (unchanged, only moved to top)      */
/* ------------------------------------------------------------------ */

interface RoomCellProps {
  room: Room;
  /** square edge-length in px that the parent grid asks for */
  size: number;
  /** needed only by Dashboard 1 */
  onRoomClick?: (room: Room, e?: React.MouseEvent<HTMLButtonElement>) => void;
  /** occupancy | activity */
  mode: RoomGridMode;
  hasError: boolean;
}

export type RoomGridMode = 'occupancy' | 'activity';

const InnerCell: React.FC<RoomCellProps & { style: CSSProperties }> = ({
  room,
  size,
  onRoomClick,
  mode,
  hasError,
  style,
}) => {
  const { createRipple } = useApp();

  /** helpers for SVG + label depending on mode */
  const isVacant   = room.is_vacant;
  const isInactive = room.is_inactive;

  /** decide big icon + colour */
  const BigIcon = () =>
    mode === 'occupancy' ? (
      isVacant ? (
        /* empty bed */
        <svg className={styles.icon} viewBox="0 0 24 24">
          <path className="fill-white" d="M19 7H5v7H3V5H1v15h2v-3h18v3h2v-9a4 4 0 0 0-4-4" />
        </svg>
      ) : (
        /* occupied bed */
        <svg className={styles.icon} viewBox="0 0 24 24">
          <path className="fill-red-600" d="M19 7h-8v7H3V5H1v15h2v-3h18v3h2v-9a4 4 0 0 0-4-4M7 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
        </svg>
      )
    ) : isInactive ? (
      /* struck bolt */
      <svg className={styles.icon} viewBox="0 0 24 24">
        <path className="fill-white" d="M13 2 3 14h7l-2 8 10-12h-7l2-8ZM3 6 4.5 4.5 20.5 18.5 19 20 3 6Z" />
      </svg>
    ) : (
      /* active bolt */
      <svg className={styles.icon} viewBox="0 0 24 24">
        <path className="fill-red-600" d="M13 2 3 14h7l-2 8 10-12h-7l2-8Z" />
      </svg>
    );

  /** little status icon (only for Dashboard 1) */
  const StatusIcon = () =>
    mode === 'occupancy' ? (
      isInactive ? (
        <svg className={styles.statusIcon} viewBox="0 0 24 24">
          <path className="fill-gray-400" d="M13 2 3 14h7l-2 8 10-12h-7l2-8ZM3 6 4.5 4.5 20.5 18.5 19 20 3 6Z" />
        </svg>
      ) : (
        <svg className={styles.statusIcon} viewBox="0 0 24 24">
          <path className="fill-yellow-600" d="M13 2 3 14h7l-2 8 10-12h-7l2-8Z" />
        </svg>
      )
    ) : null;

  return (
    <div style={style}>
      <button
        onClick={(e) => {
          if (mode === 'occupancy') onRoomClick?.(room, e);
          createRipple(e);
        }}
        className={`
          relative rounded-3xl overflow-hidden
          ${mode === 'occupancy'
            ? isVacant ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-zinc-100'
            : isInactive ? 'bg-zinc-800' : 'bg-white'}
        `}
        style={{ width: size - GAP, height: size - GAP }}
      >
        <BigIcon />
        <StatusIcon />
        <div className={styles.text(isVacant, isInactive, hasError)}>
          <span className="mr-2 text-lg sm:text-xl lg:text-2xl">{formatRoomId(room.id)}</span>
          <span className="text-lg sm:text-xl lg:text-2xl">
            {mode === 'occupancy'
              ? isVacant ? 'Vacant' : 'Occupied'
              : isInactive ? 'Inactive' : 'Active'}
          </span>
        </div>

        {(hasError || (mode === 'occupancy' && isVacant && !isInactive)) && (
          <div className={styles.errorOverlay} />
        )}
        {hasError && (
          <div className={styles.errorIcon.wrapper}>
            <div className={styles.errorIcon.container}>
              <ExclamationTriangleIcon className={styles.errorIcon.icon} aria-hidden="true" />
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

const areEqual = (
  p: Readonly<RoomCellProps & { style: CSSProperties }>,
  n: Readonly<RoomCellProps & { style: CSSProperties }>
) =>
  p.room.id           === n.room.id &&
  p.room.is_vacant    === n.room.is_vacant &&
  p.room.is_inactive  === n.room.is_inactive &&
  p.hasError          === n.hasError &&
  p.size              === n.size &&
  p.mode              === n.mode &&
  p.style.width       === n.style.width &&
  p.style.height      === n.style.height;

export const RoomCell = React.memo(
  (props: RoomCellProps & { style: CSSProperties }) => (
    <CellErrorBoundary>
      <InnerCell {...props} />
    </CellErrorBoundary>
  ),
  areEqual
);

/* ------------------------------------------------------------------ */
/*  2. GRID IMPLEMENTATION                                            */
/* ------------------------------------------------------------------ */

const GAP               = 10;   // identical to dashboards
const OVERSCAN_ROWS     = 2;
const OVERSCAN_COLUMNS  = 1;

interface RoomGridProps {
  rooms: Room[];
  mode: RoomGridMode;
  platform: { os: string; is_touch: boolean };
  /** Dashboard 1 passes this; Dashboard 2 leaves it undefined */
  onRoomClick?: (room: Room, e?: React.MouseEvent<HTMLButtonElement>) => void;
  /** array from Redux containing room-ids with error overlays */
  errors?: string[];
  /* optional: let caller forward a ref or attach pull-to-refresh */
  containerRef?: React.Ref<HTMLDivElement>;
  handleTouchStart?: React.TouchEventHandler;
  handleTouchMove?: React.TouchEventHandler;
  handleTouchEnd?: React.TouchEventHandler;
}

interface CellData {
  rooms: Room[];
  columnCount: number;
  cellSize: number;
  mode: RoomGridMode;
  onRoomClick?: (room: Room, e?: React.MouseEvent<HTMLButtonElement>) => void;
  errorSet: Set<string>;
}

export const RoomGrid: React.FC<RoomGridProps> = ({
  rooms,
  mode,
  platform,
  onRoomClick,
  errors = [],
  containerRef,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
}) => {
  /* 1. size observer ---------------------------------------------------- */
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!gridContainerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setDim({ w: r.width, h: r.height });
    });
    ro.observe(gridContainerRef.current);
    return () => ro.disconnect();
  }, []);

  /* 2. merge refs so dashboards can still grab it ----------------------- */
  const mergedRef = useMemo(
    () =>
      mergeRefs([
        gridContainerRef,
        (node: HTMLDivElement | null) => {
          /* caller’s ref may be callback or mutable object */
          if (!containerRef) return;
          if (typeof containerRef === 'function') containerRef(node);
          else (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        },
      ]),
    [containerRef]
  );

  /* 3. derive grid metrics --------------------------------------------- */
  const isMobile     = dim.w < 640;
  const xl           = window.matchMedia('(min-width: 1536px)').matches;
  const columnCount  = isMobile ? 2 : xl ? 6 : 4;
  const cellSize     = dim.w / columnCount;
  const rowCount     = Math.ceil(rooms.length / columnCount);
  const colWidthPx   = cellSize;
  const rowHeightPx  = cellSize;

  const errorSet = useMemo(() => new Set(errors), [errors]);

  /* 4. memoised cell renderer ------------------------------------------ */
  const CellRenderer = React.useCallback(
    ({ columnIndex, rowIndex, style, data }: GridChildComponentProps) => {
      const d = data as CellData;
      const idx = rowIndex * d.columnCount + columnIndex;
      if (idx >= d.rooms.length) return null;
      const room = d.rooms[idx];
      return (
        <RoomCell
          room={room}
          size={d.cellSize}
          mode={d.mode}
          onRoomClick={d.onRoomClick}
          hasError={d.errorSet.has(room.id)}
          style={style}
        />
      );
    },
    []
  );

  /* react-window’s “itemKey” so rows don’t reshuffle on state changes */
  const itemKey = ({ columnIndex, rowIndex, data }: GridChildComponentProps) => {
    const d = data as CellData;
    const idx = rowIndex * d.columnCount + columnIndex;
    return d.rooms[idx]?.id ?? `empty-${idx}`;
  };

  return (
    <div
      ref={mergedRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={styles.container(platform)}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {dim.w > 0 && dim.h > 0 && (
        <Grid
          outerRef={gridContainerRef}
          columnCount={columnCount}
          columnWidth={colWidthPx}
          height={dim.h}
          rowCount={rowCount}
          rowHeight={rowHeightPx}
          width={dim.w}
          overscanRowCount={OVERSCAN_ROWS}
          overscanColumnCount={OVERSCAN_COLUMNS}
          itemKey={itemKey}
          itemData={{
            rooms,
            columnCount,
            cellSize,
            mode,
            onRoomClick,
            errorSet,
          } satisfies CellData}
        >
          {CellRenderer}
        </Grid>
      )}
    </div>
  );
};