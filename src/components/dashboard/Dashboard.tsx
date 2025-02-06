import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RootState } from '../../store';
import { useSelector, useDispatch } from 'react-redux';
import type { User, OccupancyRecord, OccupancySummary } from '../../types/api';
import {
  Box,
  Container,
  Tab,
  Tabs,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Drawer,
  useMediaQuery,
  useTheme,
  Snackbar,
  Switch,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from 'date-fns';
import { Download, LogOut, Sun, Moon, HelpCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDebounce } from '../../hooks/useDebounce';
import { useRetry } from '../../hooks/useRetry';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import {
  selectSelectedHotel,
  selectCurrentUser,
  setSelectedHotel,
  logout,
} from '../../store/slices/authSlice';
import {
  toggleTheme,
  selectThemeMode,
  toggleAutoTheme,
  selectAutoTheme,
} from '../../store/slices/themeSlice';
import { getOccupancyData, getOccupancyRange } from '../../services/api';
import {
  setCurrentData,
  setLoading,
  setError,
} from '../../store/slices/occupancySlice';
import DayView from './DayView';
import RangeView from './RangeView';
import ComparativeView from './ComparativeView';
import HotelSearch from './HotelSearch';
import { exportToPDF } from '../../utils/pdfExport';
import { analytics } from '../../utils/analytics';
import { componentStyles } from '../../theme';

const Dashboard: React.FC = () => {
  // Existing states
  const [tabValue, setTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rangeStartDate, setRangeStartDate] = useState(startOfWeek(new Date()));
  const [rangeEndDate, setRangeEndDate] = useState(endOfWeek(new Date()));
  const today = new Date();
  const defaultCompareRange1 = {
    startDate: addDays(today, -7),
    endDate: addDays(today, -1),
  };
  const defaultCompareRange2 = {
    startDate: addDays(today, -14),
    endDate: addDays(today, -8),
  };

  const [compareRange1, setCompareRange1] = useState(defaultCompareRange1);
  const [compareRange2, setCompareRange2] = useState(defaultCompareRange2);
  const [hotelSearch, setHotelSearch] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false); // For search drawer
  const [exporting, setExporting] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    'today' | 'yesterday' | 'lastWeek'
  >('today');

  // New state for mobile sidebar
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ===== Pull-to-Refresh state and ref for mobile =====
  const [pullStartY, setPullStartY] = useState<number>(0);
  const [pullDist, setPullDist] = useState<number>(0);
  const pullThreshold = 100;
  const [pullLoading, setPullLoading] = useState<boolean>(false);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  // =====================================================

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentData = useSelector(
    (state: RootState) => state.occupancy.currentData
  );
  const selectedHotel = useSelector(selectSelectedHotel);
  const currentUser = useSelector(selectCurrentUser) as User | null;
  const themeMode = useSelector(selectThemeMode);
  const autoThemeEnabled = useSelector(selectAutoTheme);
  const loading = useSelector((state: RootState) => state.occupancy.loading);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Read selectedHotel from localStorage on component mount
    const storedHotel = localStorage.getItem('selectedHotel');
    if (storedHotel && storedHotel !== selectedHotel) {
      dispatch(setSelectedHotel(storedHotel));
    }
  }, []);

  const debouncedSearch = useDebounce(hotelSearch, 300);
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    dispatch(logout());
    navigate('/login');
  };
  const {
    state: undoableDate,
    set: setUndoableDate,
    undo: undoDate,
    redo: redoDate,
    canUndo,
    canRedo,
  } = useUndoRedo(selectedDate);

  const { execute: fetchData, error: fetchError } = useRetry(
    () => getOccupancyData(selectedHotel!, format(selectedDate, 'yyyy-MM-dd')),
    { maxAttempts: 3 }
  );

  const handleDateRangeChange = useCallback(
    async (start: Date, end: Date) => {
      if (!selectedHotel) return;
      try {
        dispatch(setLoading(true));
        setRangeStartDate(start);
        setRangeEndDate(end);
        const response = await getOccupancyRange(
          selectedHotel,
          format(start, 'yyyy-MM-dd'),
          format(end, 'yyyy-MM-dd')
        );
        const rangeDataObj = response.reduce(
          (acc, day) => ({
            ...acc,
            [day.body.date]: {
              records: day.body.records,
              summary: day.body.summary,
            },
          }),
          {} as Record<string, { records: OccupancyRecord[]; summary: OccupancySummary }>
        );
        setRangeData(rangeDataObj);
      } catch (error) {
        dispatch(setError((error as Error).message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [selectedHotel, dispatch]
  );

  const [compareData1, setCompareData1] = useState<{
    records: OccupancyRecord[];
    summary: OccupancySummary;
  } | null>(null);
  const [compareData2, setCompareData2] = useState<{
    records: OccupancyRecord[];
    summary: OccupancySummary;
  } | null>(null);

  const handleCompareViewRangeChange = useCallback(
    async (range: { startDate: Date; endDate: Date }, rangeNum: 1 | 2) => {
      if (!selectedHotel) return;
      try {
        dispatch(setLoading(true));
        const response = await getOccupancyRange(
          selectedHotel,
          format(range.startDate, 'yyyy-MM-dd'),
          format(range.endDate, 'yyyy-MM-dd')
        );
        let totalOccupiedRooms = 0;
        let totalRooms = 0;
        let recordsAggregate: OccupancyRecord[] = [];
        response.forEach((day) => {
          totalOccupiedRooms += day.body.summary.occupiedRooms;
          totalRooms += day.body.summary.totalRooms;
          recordsAggregate = recordsAggregate.concat(day.body.records);
        });
        const occupancyPercentage =
          totalRooms === 0
            ? 0
            : Math.round((totalOccupiedRooms / totalRooms) * 100);
        const aggregatedData = {
          records: recordsAggregate,
          summary: {
            totalRooms,
            occupiedRooms: totalOccupiedRooms,
            occupancyPercentage,
          },
        };
        if (rangeNum === 1) {
          setCompareRange1(range);
          setCompareData1(aggregatedData);
        } else {
          setCompareRange2(range);
          setCompareData2(aggregatedData);
        }
      } catch (error) {
        dispatch(setError((error as Error).message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [selectedHotel, dispatch]
  );

  useEffect(() => {
    if (selectedHotel) {
      const fetchInitialData = async () => {
        try {
          dispatch(setLoading(true));
          const response = await getOccupancyData(
            selectedHotel,
            format(selectedDate, 'yyyy-MM-dd')
          );
          dispatch(setCurrentData(response.body));
        } catch (error) {
          dispatch(setError((error as Error).message));
        } finally {
          dispatch(setLoading(false));
        }
      };
      fetchInitialData();
    }
  }, [selectedHotel, selectedDate, dispatch]);

  useEffect(() => {
    if (selectedHotel && tabValue === 1) {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      handleDateRangeChange(start, end);
    }
  }, [selectedHotel, tabValue, selectedDate, handleDateRangeChange]);

  useEffect(() => {
    if (selectedHotel && tabValue === 2) {
      handleCompareViewRangeChange(compareRange1, 1);
      handleCompareViewRangeChange(compareRange2, 2);
    }
  }, [
    selectedHotel,
    tabValue,
    compareRange1,
    compareRange2,
    handleCompareViewRangeChange,
  ]);

  useHotkeys('ctrl+e', () => handleExport(), { preventDefault: true });
  useHotkeys('ctrl+d', () => dispatch(toggleTheme()), { preventDefault: true });
  useHotkeys('ctrl+z', () => canUndo && undoDate(), { preventDefault: true });
  useHotkeys('ctrl+y', () => canRedo && redoDate(), { preventDefault: true });

  const hotels = currentUser?.hotels ?? [];
  
  const filteredHotels = hotels.filter((hotel) =>
    hotel?.hotelname?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );  

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // If the Live tab is selected (index 3), open external link and do not change tab
    if (newValue === 3) {
      analytics.trackUserAction('change_tab', 'live');
      navigate('/live');
      if (isMobile) {
        setMobileSidebarOpen(false);
      }
      return;
    }
    setTabValue(newValue);
    analytics.trackUserAction('change_tab', String(newValue));
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    analytics.trackUserAction('export_pdf');
    try {
      let exportData;
      let title;
      switch (tabValue) {
        case 0:
          title = `Daily Occupancy Report - ${format(
            selectedDate,
            'MMMM d, yyyy'
          )}`;
          exportData = {
            records: currentData.records,
            summary: currentData.summary,
          };
          break;
        case 1:
          const diffDays =
            Math.floor(
              (rangeEndDate.getTime() - rangeStartDate.getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1;
          const rangeType = diffDays <= 7 ? 'week' : 'month';
          title =
            rangeType === 'week'
              ? 'Weekly Occupancy Report'
              : 'Monthly Occupancy Report';
          exportData = { data: rangeData, rangeType };
          break;
        case 2:
          title = `Comparative Occupancy Report`;
          exportData = { data1: compareData1, data2: compareData2 };
          break;
        default:
          title = 'Occupancy Report';
          exportData = currentData;
      }
      await exportToPDF(title, exportData);
    } finally {
      setExporting(false);
    }
  };

  const handleQuickJump = (type: 'today' | 'yesterday' | 'lastWeek') => {
    let newDate: Date;
    switch (type) {
      case 'today':
        newDate = new Date();
        break;
      case 'yesterday':
        newDate = subDays(new Date(), 1);
        break;
      case 'lastWeek':
        newDate = subDays(new Date(), 7);
        break;
      default:
        newDate = new Date();
    }
    if (isSameDay(newDate, selectedDate)) return;
    setSelectedTimeframe(type);
    setUndoableDate(newDate);
    setSelectedDate(newDate);
    analytics.trackUserAction('quick_jump', type);
  };

  const [rangeData, setRangeData] = useState<
    Record<string, { records: OccupancyRecord[]; summary: OccupancySummary }>
  >({});

  // Sidebar content (used in both desktop and mobile)
  const sidebar = (
    <Box
      sx={{
        width: 240,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        height: '100vh',
        position: 'sticky',
        top: 0,
        p: 2,
      }}
    >
      <Tabs
        orientation="vertical"
        value={tabValue}
        onChange={handleTabChange}
        aria-label="Dashboard sidebar tabs"
        sx={componentStyles.dashboard.tabs}
      >
        <Tab label="Day" id="tab-0" aria-controls="tabpanel-0" />
        <Tab label="Range" id="tab-1" aria-controls="tabpanel-1" />
        <Tab label="Compare" id="tab-2" aria-controls="tabpanel-2" />
        <Tab label="Live" id="tab-3" aria-controls="tabpanel-3" />
      </Tabs>
      {isMobile && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogout}
              aria-label="Logout"
              color="inherit"
              sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <LogOut />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  // ===== Pull-to-Refresh event handlers for mobile =====
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (mobileScrollRef.current && mobileScrollRef.current.scrollTop === 0) {
      setPullStartY(e.touches[0].clientY);
    } else {
      setPullStartY(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!pullStartY) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - pullStartY;
    setPullDist(distance);
    if (distance > 0) {
      e.preventDefault();
      setPullLoading(true);
    }
  };

  const handleTouchEnd = () => {
    if (pullDist > pullThreshold) {
      // Refresh logic – here we reload the page.
      window.location.reload();
    }
    setPullLoading(false);
    setPullDist(0);
    setPullStartY(0);
  };
  // =====================================================

  return (
    <Box sx={componentStyles.dashboard.main} component="main" tabIndex={-1}>
      <AppBar position="sticky" elevation={0} sx={{ minHeight: 100 }}>
        <Toolbar sx={{ minHeight: 100 }}>
          {/* Mobile: Button to open sidebar */}
          {isMobile && (
            <IconButton
              onClick={() => setMobileSidebarOpen(true)}
              color="inherit"
              sx={{ mr: 1 }}
              aria-label="Open sidebar"
            >
              <MenuIcon />
            </IconButton>
          )}
          {/* Left: Hotel Selection Dropdown */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HotelSearch
              variant="dropdown"
              hotels={currentUser?.hotels || []}
              selectedHotel={selectedHotel}
              onHotelChange={(hotelId) => {
                dispatch(setSelectedHotel(hotelId));
                analytics.trackUserAction('change_hotel', hotelId);
              }}
            />
          </Box>
          {/* Center: Wider Hotel Search Bar (desktop only) */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <HotelSearch
                variant="search"
                hotels={currentUser?.hotels || []}
                selectedHotel={selectedHotel}
                onHotelChange={(hotelId) => {
                  dispatch(setSelectedHotel(hotelId));
                  analytics.trackUserAction('change_hotel', hotelId);
                }}
              />
            </Box>
          )}
          {/* Right: Header actions */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Search hotels"
                color="inherit"
              >
                <Search />
              </IconButton>
            )}
            <Box sx={{ ml: 2, position: 'relative', display: 'inline-flex' }}>
              <Tooltip title="Toggle theme (Ctrl+D)">
                <IconButton
                  onClick={() => dispatch(toggleTheme())}
                  aria-label="Toggle theme"
                  color="inherit"
                >
                  {themeMode === 'light' ? <Moon /> : <Sun />}
                </IconButton>
              </Tooltip>
              <Box
                sx={{
                  position: 'absolute',
                  top: '70%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1,
                  pointerEvents: 'auto',
                }}
              >
                <Tooltip title={`Auto Theme ${autoThemeEnabled ? 'On' : 'Off'} (Click to toggle)`}>
                  <Switch
                    checked={autoThemeEnabled}
                    onChange={() => dispatch(toggleAutoTheme())}
                    color="default"
                    inputProps={{ 'aria-label': 'auto theme toggle' }}
                  />
                </Tooltip>
              </Box>
            </Box>
            <Tooltip title="Export to PDF (Ctrl+E)">
              <span>
                <IconButton
                  onClick={handleExport}
                  disabled={loading || exporting}
                  size={isMobile ? 'small' : 'medium'}
                  aria-label="Export to PDF"
                  color="inherit"
                >
                  <Download />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Help">
              <a
                href="https://walkinwatchdog.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit' }}
              >
                <IconButton aria-label="Help" color="inherit">
                  <HelpCircle />
                </IconButton>
              </a>
            </Tooltip>
            {!isMobile && (
              <Tooltip title="Logout">
                <IconButton
                  onClick={handleLogout}
                  aria-label="Logout"
                  color="inherit"
                >
                  <LogOut />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: 240 } }}
        >
          {sidebar}
        </Drawer>
      )}

      {/* Main content layout */}
      {isMobile ? (
        // Mobile view: scrollable container with pull-to-refresh
        <div
          ref={mobileScrollRef}
          style={{ height: '100%', overflowY: 'auto', position: 'relative' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pull-to-Refresh indicator overlaid at the top */}
          {pullLoading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                zIndex: 10,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                style={{
                  marginRight: '0.5rem',
                  width: '20px',
                  height: '20px',
                  animation: 'spin 1s linear infinite',
                }}
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  style={{ opacity: 0.25 }}
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                  style={{ opacity: 0.75 }}
                />
              </svg>
              <span>Refreshing…</span>
            </div>
          )}
          <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {tabValue === 0 && (
                <div role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0">
                  <DayView
                    date={selectedDate}
                    occupancyData={currentData.records}
                    summary={
                      currentData.summary || {
                        totalRooms: 0,
                        occupiedRooms: 0,
                        occupancyPercentage: 0,
                      }
                    }
                    loading={loading}
                    onDateChange={(newDate: Date) => setSelectedDate(newDate)}
                  />
                </div>
              )}
              {tabValue === 1 && (
                <div role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1">
                  <RangeView
                    startDate={rangeStartDate}
                    endDate={rangeEndDate}
                    rangeData={rangeData}
                    onDateRangeChange={handleDateRangeChange}
                    loading={loading}
                  />
                </div>
              )}
              {tabValue === 2 && (
                <div role="tabpanel" id="tabpanel-2" aria-labelledby="tab-2">
                  <ComparativeView
                    range1={compareRange1}
                    range2={compareRange2}
                    data1={compareData1}
                    data2={compareData2}
                    onRangeChange={handleCompareViewRangeChange}
                    loading={loading}
                  />
                </div>
              )}
            </LocalizationProvider>
          </Container>
        </div>
      ) : (
        // Desktop view: permanent sidebar and content layout
        <Box sx={{ display: 'flex' }}>
          {sidebar}
          <Box sx={{ flexGrow: 1 }}>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                {tabValue === 0 && (
                  <div role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0">
                    <DayView
                      date={selectedDate}
                      occupancyData={currentData.records}
                      summary={
                        currentData.summary || {
                          totalRooms: 0,
                          occupiedRooms: 0,
                          occupancyPercentage: 0,
                        }
                      }
                      loading={loading}
                      onDateChange={(newDate: Date) => setSelectedDate(newDate)}
                    />
                  </div>
                )}
                {tabValue === 1 && (
                  <div role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1">
                    <RangeView
                      startDate={rangeStartDate}
                      endDate={rangeEndDate}
                      rangeData={rangeData}
                      onDateRangeChange={handleDateRangeChange}
                      loading={loading}
                    />
                  </div>
                )}
                {tabValue === 2 && (
                  <div role="tabpanel" id="tabpanel-2" aria-labelledby="tab-2">
                    <ComparativeView
                      range1={compareRange1}
                      range2={compareRange2}
                      data1={compareData1}
                      data2={compareData2}
                      onRangeChange={handleCompareViewRangeChange}
                      loading={loading}
                    />
                  </div>
                )}
              </LocalizationProvider>
            </Container>
          </Box>
        </Box>
      )}

      {/* Existing Mobile Drawer for searching hotels */}
      <Drawer
        anchor="bottom"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{ sx: componentStyles.dashboard.drawerPaper }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Search Hotels
          </Typography>
          <HotelSearch
            variant="search"
            hotels={currentUser?.hotels || []}
            selectedHotel={selectedHotel}
            onHotelChange={(hotelId) => {
              dispatch(setSelectedHotel(hotelId));
              analytics.trackUserAction('change_hotel', hotelId);
              setMobileFilterOpen(false);
            }}
            isMobile
          />
        </Box>
      </Drawer>

      <Snackbar
        open={exporting}
        message="Generating PDF..."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default Dashboard;