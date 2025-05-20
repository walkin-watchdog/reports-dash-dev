import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Pagination,
  Tabs,
  Tab,
  Alert,
  IconButton,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import TableSortLabel from '@mui/material/TableSortLabel';
import { DatePicker } from '@mui/x-date-pickers';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  PieChart,
  LineChart,
} from 'lucide-react';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  format,
  fromUnixTime,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  isAfter,
} from 'date-fns';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { OccupancyRecord } from '../../types/api';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTheme as useThemeInListItem } from '@mui/material';
import { componentStyles } from '../../theme';

const centerTextPlugin = {
  id: 'centerText',
  beforeDraw: (chart: any) => {
    const centerTextOptions = chart.config.options.plugins.centerText;
    if (centerTextOptions && centerTextOptions.display) {
      const {
        ctx,
        chartArea: { width, height },
      } = chart;
      ctx.save();
      const fontSize = centerTextOptions.font.size;
      const fontWeight = centerTextOptions.font.weight;
      const fontFamily = centerTextOptions.font.family || 'Arial';
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = centerTextOptions.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(centerTextOptions.text, width / 2, height / 2);
      ctx.restore();
    }
  },
};

ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  ChartDataLabels,
  centerTextPlugin,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title
);

interface DayViewProps {
  date: Date;
  occupancyData: OccupancyRecord[];
  summary: {
    totalRooms: number;
    occupiedRooms: number;
    occupancyPercentage: number;
    categoryTotals?: Record<string, number>;
  };
  onDateChange?: (newDate: Date) => void;
  initialViewTab?: 'overall' | 'category';
  initialCategoryFilter?: string;
}

const ITEMS_PER_PAGE = 5;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`room-tabpanel-${index}`}
      aria-labelledby={`room-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={componentStyles.dayView.tabPanel}>{children}</Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => ({
  id: `room-tab-${index}`,
  'aria-controls': `room-tabpanel-${index}`,
});

interface RoomsTableProps {
  rooms: OccupancyRecord[];
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
}

const RoomsTable: React.FC<RoomsTableProps> = ({
  rooms,
  sortConfig,
  onSort,
}) => {
  const theme = useTheme();
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sortConfig.key === 'roomid'}
                direction={
                  sortConfig.key === 'roomid' ? sortConfig.direction : 'asc'
                }
                onClick={() => onSort('roomid')}
              >
                Room Number
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortConfig.key === 'room_category'}
                direction={
                  sortConfig.key === 'room_category'
                    ? sortConfig.direction
                    : 'asc'
                }
                onClick={() => onSort('room_category')}
              >
                Category
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortConfig.key === 'check_in'}
                direction={
                  sortConfig.key === 'check_in' ? sortConfig.direction : 'asc'
                }
                onClick={() => onSort('check_in')}
              >
                Check-in Time
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortConfig.key === 'check_out'}
                direction={
                  sortConfig.key === 'check_out' ? sortConfig.direction : 'asc'
                }
                onClick={() => onSort('check_out')}
              >
                Check-out Time
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rooms.map((room, index) => {
            const isError =
              room.check_in_unixstamp &&
              room.check_out_unixstamp &&
              room.check_out_unixstamp - room.check_in_unixstamp <= 1800;
            return (
              <TableRow key={`${room.roomid}-${index}`}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Typography variant="body1">Room {room.roomid}</Typography>
                    <Box ml={1} display="flex">
                      {isError ? (
                        <Chip
                          label="Error"
                          size="small"
                          sx={componentStyles.dayView.errorChip(theme)}
                        />
                      ) : (
                        <>
                          {room.checkInCategory === 'early' && (
                            <Chip
                              label="Early Check-in"
                              size="small"
                              sx={componentStyles.dayView.earlyChip(theme)}
                            />
                          )}
                          {room.check_out_unixstamp &&
                            room.checkOutCategory === 'late' && (
                              <Chip
                                label="Late Check-out"
                                size="small"
                                sx={componentStyles.dayView.lateChip(theme)}
                              />
                            )}
                        </>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{room.room_category}</TableCell>
                <TableCell>
                  {room.check_in_unixstamp
                    ? format(
                        fromUnixTime(room.check_in_unixstamp),
                        'MMM d, h:mm a'
                      )
                    : '-'}
                </TableCell>
                <TableCell>
                  {room.check_out_unixstamp
                    ? format(
                        fromUnixTime(room.check_out_unixstamp),
                        'MMM d, h:mm a'
                      )
                    : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const DayView: React.FC<DayViewProps> = ({
  date,
  occupancyData,
  summary,
  loading,
  onDateChange,
  initialViewTab = 'overall',
  initialCategoryFilter,
}) => {
  const [viewTab, setViewTab] = useState<'overall' | 'category'>(
    initialViewTab
  );
  const [page, setPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState(0);
  const [groupBy, setGroupBy] = useState<'category' | 'status'>('category');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    string | null
  >(initialCategoryFilter || null);
  const [overallView, setOverallView] = useState<'doughnut' | 'graph'>(
    'doughnut'
  );
  const theme = useTheme();

  const normalCheckInsCount = useMemo(
    () =>
      occupancyData.filter((room) => room.checkInCategory === 'normal').length,
    [occupancyData]
  );
  const earlyCheckInsCount = useMemo(
    () =>
      occupancyData.filter((room) => room.checkInCategory === 'early').length,
    [occupancyData]
  );
  const normalCheckOutsCount = useMemo(
    () =>
      occupancyData.filter(
        (room) => room.check_out_unixstamp && room.checkOutCategory === 'normal'
      ).length,
    [occupancyData]
  );
  const lateCheckOutsCount = useMemo(
    () =>
      occupancyData.filter(
        (room) => room.check_out_unixstamp && room.checkOutCategory === 'late'
      ).length,
    [occupancyData]
  );

  function getCategorySummaries(data: OccupancyRecord[]) {
    const categories = Array.from(new Set(data.map((r) => r.room_category)));
    const categoryStats: Record<
      string,
      { occupiedRooms: number; totalRooms: number; occupancyPercentage: number }
    > = {};
    categories.forEach((category) => {
      const categoryRecords = data.filter((r) => r.room_category === category);
      const totalRooms = new Set(categoryRecords.map((r) => r.roomid)).size;
      const occupiedRooms = categoryRecords.filter(
        (r) => r.check_in_unixstamp != null
      ).length;
      const occupancyPercentage =
        totalRooms === 0 ? 0 : Math.round((occupiedRooms / totalRooms) * 100);
      categoryStats[category] = {
        occupiedRooms,
        totalRooms,
        occupancyPercentage,
      };
    });
    return categoryStats;
  }

  const categoryStats = useMemo(
    () => getCategorySummaries(occupancyData),
    [occupancyData, summary.occupiedRooms, summary.totalRooms]
  );

  // Only show the filtered category if activeCategoryFilter is set.
  const categoryStatsEntries = useMemo(() => {
    const entries = Object.entries(categoryStats);
    return activeCategoryFilter
      ? entries.filter(([cat]) => cat === activeCategoryFilter)
      : entries;
  }, [categoryStats, activeCategoryFilter]);

  const filteredOccupancyDataForCategory = useMemo(
    () =>
      activeCategoryFilter
        ? occupancyData.filter(
            (room) => room.room_category === activeCategoryFilter
          )
        : occupancyData,
    [occupancyData, activeCategoryFilter]
  );

  const sortRooms = (
    rooms: OccupancyRecord[],
    sortConfig: { key: string; direction: 'asc' | 'desc' }
  ) => {
    return [...rooms].sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortConfig.key) {
        case 'roomid':
          aValue = a.roomid;
          bValue = b.roomid;
          break;
        case 'room_category':
          aValue = a.room_category;
          bValue = b.room_category;
          break;
        case 'check_in':
          aValue = a.check_in_unixstamp || 0;
          bValue = b.check_in_unixstamp || 0;
          break;
        case 'check_out':
          aValue = a.check_out_unixstamp || 0;
          bValue = b.check_out_unixstamp || 0;
          break;
        default:
          aValue = '';
          bValue = '';
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const overallSortConfigInitial = {
    key: 'room_category',
    direction: 'asc' as 'asc' | 'desc',
  };
  const [overallSortConfig, setOverallSortConfig] = useState(
    overallSortConfigInitial
  );
  const categorySortConfigInitial = {
    key: 'roomid',
    direction: 'asc' as 'asc' | 'desc',
  };
  const [categorySortConfig, setCategorySortConfig] = useState(
    categorySortConfigInitial
  );

  const filteredOverallRooms = useMemo(() => {
    switch (selectedTab) {
      case 0:
        return occupancyData;
      case 1:
        return occupancyData.filter((room) => room.check_in_unixstamp != null);
      case 2:
        return occupancyData.filter((room) => room.checkInCategory === 'early');
      case 3:
        return occupancyData.filter((room) => room.check_out_unixstamp != null);
      case 4:
        return occupancyData.filter(
          (room) =>
            room.check_out_unixstamp != null && room.checkOutCategory === 'late'
        );
      case 5:
        return occupancyData.filter(
          (room) =>
            room.check_in_unixstamp != null &&
            room.check_out_unixstamp != null &&
            room.check_out_unixstamp - room.check_in_unixstamp <= 1800
        );
      default:
        return occupancyData;
    }
  }, [occupancyData, selectedTab]);

  const sortedFilteredOverallRooms = useMemo(
    () => sortRooms(filteredOverallRooms, overallSortConfig),
    [filteredOverallRooms, overallSortConfig]
  );
  const paginatedOverallRooms = useMemo(() => {
    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    return sortedFilteredOverallRooms.slice(
      startIdx,
      startIdx + ITEMS_PER_PAGE
    );
  }, [sortedFilteredOverallRooms, page]);

  const sortedCategoryRooms = useMemo(
    () => sortRooms(filteredOccupancyDataForCategory, categorySortConfig),
    [filteredOccupancyDataForCategory, categorySortConfig]
  );
  const paginatedCategoryRooms = useMemo(() => {
    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    return sortedCategoryRooms.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [sortedCategoryRooms, page]);

  const getChartOptions = (centerText: string) => ({
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: theme.palette.text.primary },
      },
      centerText: {
        display: true,
        text: centerText,
        color: theme.palette.text.primary,
        font: { weight: '600', size: 24 },
      },
      datalabels: { display: false },
    },
  });

  const handleSort = (key: string) => {
    if (viewTab === 'overall') {
      setOverallSortConfig((prev) =>
        prev.key === key
          ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
          : { key, direction: 'asc' }
      );
    } else {
      setCategorySortConfig((prev) =>
        prev.key === key
          ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
          : { key, direction: 'asc' }
      );
    }
    setPage(1);
  };

  const handleDayNavigate = (direction: 'prev' | 'next') => {
    if (onDateChange) {
      const newDate =
        direction === 'prev' ? subDays(date, 1) : addDays(date, 1);
      if (direction === 'next') {
        const today = startOfDay(new Date());
        if (isAfter(startOfDay(newDate), today)) {
          return;
        }
      }
      onDateChange(newDate);
    }
  };

  const hours = Array.from({ length: 12 }, (_, i) => i * 2);

  const checkinsPerHour = hours.map(
    (slotStart) =>
      occupancyData.filter((room) => {
        if (!room.check_in_unixstamp) return false;
        const checkInDate = new Date(room.check_in_unixstamp * 1000);
        const hour = checkInDate.getHours();
        // Aggregate check-ins in the 2-hour slot [slotStart, slotStart + 2)
        return hour >= slotStart && hour < slotStart + 2;
      }).length
  );

  const checkoutsPerHour = hours.map(
    (slotStart) =>
      occupancyData.filter((room) => {
        if (!room.check_out_unixstamp) return false;
        const checkOutDate = new Date(room.check_out_unixstamp * 1000);
        const hour = checkOutDate.getHours();
        // Aggregate check-outs in the 2-hour slot [slotStart, slotStart + 2)
        return hour >= slotStart && hour < slotStart + 2;
      }).length
  );

  const lineChartData = {
    labels: hours.map((hour) => `${hour}:00`),
    datasets: [
      {
        label: 'Check-ins',
        data: checkinsPerHour,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
        fill: {
          target: 'origin',
          above:
            theme.palette.mode === 'dark'
              ? 'rgba(144, 202, 249, 0.15)'
              : 'rgba(25, 118, 210, 0.1)',
        },
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#fff',
      },
      {
        label: 'Check-outs',
        data: checkoutsPerHour,
        borderColor: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.main,
        fill: {
          target: 'origin',
          above:
            theme.palette.mode === 'dark'
              ? 'rgba(144, 202, 249, 0.15)'
              : 'rgba(156, 39, 176, 0.15)',
        },
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#fff',
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: {
        display: true,
        text: 'Check-ins/Check-outs',
        padding: { bottom: 40 },
        color: theme.palette.text.secondary,
      },
      datalabels: {
        display: true,
        align: 'top',
        formatter: function (_value: any) {},
        color: theme.palette.text.primary,
        font: { weight: '600', size: 12 },
      },
    },
    scales: {
      x: {
        title: {
          display: false,
          text: 'Time of Day',
          padding: 20,
          color: theme.palette.text.secondary,
        },
        ticks: {
          color: theme.palette.text.secondary,
          padding: 10,
        },
        border: { display: false },
        grid: { display: false, drawBorder: false },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Number of Rooms' },
        grid: {
          display: true,
          color: theme.palette.divider,
          drawBorder: false,
          borderDash: [5, 5],
        },
        ticks: {
          color: theme.palette.text.secondary,
          padding: 10,
        },
        border: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!occupancyData.length) {
    return (
      <Alert severity="info">
        No occupancy data available for {format(date, 'MMMM d, yyyy')}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={viewTab}
          exclusive
          onChange={(_event, newView) => {
            if (newView) {
              setViewTab(newView);
              setPage(1);
              setSelectedTab(0);
            }
          }}
          aria-label="view tab"
          sx={componentStyles.dayView.toggleButtonGroup(theme)}
        >
          <ToggleButton value="overall" aria-label="Overall">
            Overall
          </ToggleButton>
          <ToggleButton value="category" aria-label="Category Wise">
            Category Wise
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {viewTab === 'overall' ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ position: 'relative' }}>
              {/* Toggle button to switch overall occupancy view */}
              <Tooltip
                title={
                  overallView === 'graph'
                    ? 'Switch to Doughnut View'
                    : 'Switch to Graph View'
                }
              >
                <IconButton
                  onClick={() =>
                    setOverallView(
                      overallView === 'graph' ? 'doughnut' : 'graph'
                    )
                  }
                  sx={{ position: 'absolute', top: 16, right: 16 }}
                  aria-label={
                    overallView === 'graph'
                      ? 'Switch to Doughnut View'
                      : 'Switch to Graph View'
                  }
                >
                  {overallView === 'graph' ? <PieChart /> : <LineChart />}
                </IconButton>
              </Tooltip>
              <CardContent>
                {/* Common header and navigation */}
                <Box textAlign="center">
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Occupancy
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <IconButton onClick={() => handleDayNavigate('prev')}>
                      <ChevronLeft />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {format(date, 'MMMM d, yyyy')}
                    </Typography>
                    <IconButton onClick={() => handleDayNavigate('next')}>
                      <ChevronRight />
                    </IconButton>
                  </Box>
                  <DatePicker
                    label="Select Date"
                    value={date}
                    onChange={(newDate) => {
                      if (newDate && onDateChange) onDateChange(newDate);
                    }}
                    disableFuture
                  />
                </Box>
                {/* Conditional chart rendering */}
                {overallView === 'doughnut' ? (
                  <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Grid item xs={12} md={4} order={{ xs: 2, md: 1 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Rooms Occupied:
                          </Typography>
                          <Typography variant="h6">
                            {summary.occupiedRooms}
                          </Typography>
                          <Typography variant="body2">
                            Normal Check-ins:
                          </Typography>
                          <Typography variant="h6">
                            {normalCheckInsCount}
                          </Typography>
                          <Typography variant="body2">
                            Normal Checkouts:
                          </Typography>
                          <Typography variant="h6">
                            {normalCheckOutsCount}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">Room Vacant:</Typography>
                          <Typography variant="h6">
                            {summary.totalRooms - summary.occupiedRooms}
                          </Typography>
                          <Typography variant="body2">
                            Early Check-ins:
                          </Typography>
                          <Typography variant="h6">
                            {earlyCheckInsCount}
                          </Typography>
                          <Typography variant="body2">
                            Late Checkouts:
                          </Typography>
                          <Typography variant="h6">
                            {lateCheckOutsCount}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      md={4}
                      order={{ xs: 1, md: 2 }}
                      container
                      justifyContent="center"
                    >
                      <Box
                        sx={{
                          height: 300,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Doughnut
                          data={{
                            labels: Object.keys(categoryStats),
                            datasets: [
                              {
                                data: [
                                  ...Object.keys(categoryStats).map(
                                    (cat) => categoryStats[cat].occupiedRooms
                                  ),
                                  summary.totalRooms - summary.occupiedRooms,
                                ],
                                backgroundColor: [
                                  ...Object.keys(categoryStats).map(
                                    (_, index) => {
                                      const colors = [
                                        theme.palette.primary.main,
                                        theme.palette.secondary.main,
                                        theme.palette.error.main,
                                        theme.palette.warning.main,
                                        theme.palette.info.main,
                                        theme.palette.success.main,
                                      ];
                                      return colors[index % colors.length];
                                    }
                                  ),
                                  theme.palette.mode === 'dark'
                                    ? '#333'
                                    : '#e0e0e0',
                                ],
                                borderWidth: 0,
                              },
                            ],
                          }}
                          options={getChartOptions(
                            `${summary.occupancyPercentage}%`
                          )}
                        />
                      </Box>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      md={4}
                      order={{ xs: 3, md: 3 }}
                      sx={{ display: { xs: 'none', md: 'block' } }}
                    />
                  </Grid>
                ) : (
                  <Box
                    sx={{
                      height: 400,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 2,
                      '& canvas': { width: '100% !important' },
                    }}
                  >
                    <Line data={lineChartData} options={lineChartOptions} />
                  </Box>
                )}
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ mt: 2 }}
                >
                  {summary.occupiedRooms} / {summary.totalRooms} Rooms Occupied
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  {/* Updated Tabs: Enable horizontal scrolling in mobile mode */}
                  <Tabs
                    value={selectedTab}
                    onChange={(_event, newValue) => {
                      setSelectedTab(newValue);
                      setPage(1);
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    aria-label="overall room status tabs"
                  >
                    {[
                      'All Rooms',
                      'Check-ins',
                      'Early Check-ins',
                      'Check-outs',
                      'Late Check-outs',
                      'Error',
                    ].map((label, index) => (
                      <Tab key={index} label={label} {...a11yProps(index)} />
                    ))}
                  </Tabs>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <RoomsTable
                    rooms={paginatedOverallRooms}
                    sortConfig={overallSortConfig}
                    onSort={handleSort}
                  />
                  {filteredOverallRooms.length > ITEMS_PER_PAGE && (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <Pagination
                        count={Math.ceil(
                          filteredOverallRooms.length / ITEMS_PER_PAGE
                        )}
                        page={page}
                        onChange={(_e, value) => setPage(value)}
                        color="primary"
                      />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Grid container spacing={3} sx={{ mt: 3, mb: 3 }}>
              {categoryStatsEntries.map(([category, stats]) => {
                const data = {
                  labels: ['Occupied', 'Vacant'],
                  datasets: [
                    {
                      data: [
                        stats.occupiedRooms,
                        stats.totalRooms - stats.occupiedRooms,
                      ],
                      backgroundColor: [
                        theme.palette.primary.main,
                        theme.palette.mode === 'dark' ? '#333' : '#e0e0e0',
                      ],
                      borderWidth: 0,
                    },
                  ],
                };
                return (
                  <Grid item xs={12} sm={6} md={4} key={category}>
                    <Card sx={{ position: 'relative' }}>
                      <IconButton
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                        onClick={() => {
                          setActiveCategoryFilter(
                            activeCategoryFilter === category ? null : category
                          );
                          setPage(1);
                        }}
                        aria-label={
                          activeCategoryFilter === category
                            ? `Clear filter for ${category}`
                            : `Filter by ${category}`
                        }
                      >
                        {activeCategoryFilter === category ? (
                          <FilterAltOffIcon />
                        ) : (
                          <FilterListIcon />
                        )}
                      </IconButton>
                      <CardContent>
                        <Box textAlign="center">
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ fontWeight: 600, mb: 2 }}
                          >
                            {category} Occupancy
                          </Typography>
                          <Box
                            sx={{
                              height: 200,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Doughnut
                              data={data}
                              options={getChartOptions(
                                `${stats.occupancyPercentage}%`
                              )}
                            />
                          </Box>
                          <Typography
                            variant="subtitle1"
                            color="text.secondary"
                          >
                            {stats.occupiedRooms} / {stats.totalRooms} Rooms
                            Occupied
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <RoomsTable
                  rooms={paginatedCategoryRooms}
                  sortConfig={categorySortConfig}
                  onSort={handleSort}
                />
                {filteredOccupancyDataForCategory.length > ITEMS_PER_PAGE && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                      count={Math.ceil(
                        filteredOccupancyDataForCategory.length / ITEMS_PER_PAGE
                      )}
                      page={page}
                      onChange={(_e, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Dialog open={showDatePicker} onClose={() => setShowDatePicker(false)}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Select Date
          </Typography>
          <DatePicker
            label="Select Date"
            value={date}
            onChange={(newDate) => {
              if (newDate && onDateChange) onDateChange(newDate);
              setShowDatePicker(false);
            }}
            disableFuture
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default DayView;

// ----------------------------------------------------------------------
// RoomListItem Component (exported as a named export)
// ----------------------------------------------------------------------
export const RoomListItem: React.FC<{ room: OccupancyRecord }> = ({ room }) => {
  const theme = useThemeInListItem();
  const isError =
    room.check_in_unixstamp &&
    room.check_out_unixstamp &&
    room.check_out_unixstamp - room.check_in_unixstamp <= 1800;
  return (
    <ListItem
      secondaryAction={
        <Box>
          {isError ? (
            <Chip
              label="Error"
              size="small"
              sx={{
                backgroundColor: theme.palette.error.dark,
                color: theme.palette.error.contrastText,
                fontWeight: 600,
                mr: 1,
              }}
            />
          ) : (
            <>
              {room.checkInCategory === 'early' && (
                <Chip
                  label="Early Check-in"
                  size="small"
                  sx={{
                    backgroundColor: theme.palette.warning.main,
                    color: theme.palette.warning.contrastText,
                    fontWeight: 600,
                    mr: 1,
                  }}
                />
              )}
              {room.check_out_unixstamp && room.checkOutCategory === 'late' && (
                <Chip
                  label="Late Check-out"
                  size="small"
                  sx={{
                    backgroundColor: theme.palette.error.main,
                    color: theme.palette.error.contrastText,
                    fontWeight: 600,
                  }}
                />
              )}
            </>
          )}
        </Box>
      }
    >
      <ListItemText
        primary={`Room ${room.roomid} (${room.room_category})`}
        secondary={`Check-in: ${format(
          fromUnixTime(room.check_in_unixstamp),
          'MMM d, h:mm a'
        )}${
          room.check_out_unixstamp
            ? ` • Check-out: ${format(
                fromUnixTime(room.check_out_unixstamp),
                'MMM d, h:mm a'
              )}`
            : ''
        }`}
      />
    </ListItem>
  );
};
