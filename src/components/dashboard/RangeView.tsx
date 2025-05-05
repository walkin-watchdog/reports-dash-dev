import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  IconButton,
  Alert,
  Tooltip,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfDay,
  endOfDay,
  isAfter,
} from 'date-fns';
import {
  X,
  ChevronLeft,
  ChevronRight,
  PieChart,
  LineChart,
} from 'lucide-react';
import DayView from './DayView';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { OccupancyRecord } from '../../types/api';
import { componentStyles } from '../../theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler,
  ChartDataLabels
);

interface RangeViewProps {
  startDate: Date;
  endDate: Date;
  rangeData: Record<
    string,
    {
      records: OccupancyRecord[];
      summary: {
        totalRooms: number;
        occupiedRooms: number;
        occupancyPercentage: number;
        categoryTotals?: Record<string, number>;
      };
    }
  >;
  onDateRangeChange: (start: Date, end: Date) => void;
  loading: boolean;
}

type RangeType = 'today' | 'week' | 'month' | 'custom';

export interface OccupancyRecord {
  roomid: string;
  room_category: string;
  check_in_unixstamp: number;
  check_out_unixstamp?: number;
  checkInCategory?: 'early' | 'normal';
  checkOutCategory?: 'normal' | 'late' | null;
}

const getCategoryStatsForSingleDay = (
  records: OccupancyRecord[],
  daySummary: { totalRooms: number; occupiedRooms: number; occupancyPercentage: number }
) => {
  const cats = Array.from(new Set(records.map((r) => r.room_category)));
  const stats: Record<string, { totalRooms: number; occupiedRooms: number; occupancyPercentage: number }> = {};

  cats.forEach((category) => {
    const categoryRecords = records.filter((r) => r.room_category === category);

    // total rooms in this category that day
    const totalRooms = new Set(categoryRecords.map((r) => r.roomid)).size;
    // only count real check-ins
    const occupiedRooms = categoryRecords.filter(
      (r) => r.check_in_unixstamp != null
    ).length;

    const occupancyPercentage =
      totalRooms === 0 ? 0 : Math.round((occupiedRooms / totalRooms) * 100);

    stats[category] = { totalRooms, occupiedRooms, occupancyPercentage };
  });

  return stats;
};

const RangeView: React.FC<RangeViewProps> = ({
  startDate,
  endDate,
  rangeData,
  onDateRangeChange,
  loading,
}) => {
  const [rangeType, setRangeType] = useState<RangeType>('week');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedView, setSelectedView] = useState<'doughnut' | 'graph'>(
    'doughnut'
  );
  const [categoryViews, setCategoryViews] = useState<
    Record<string, 'graph' | 'doughnut'>
  >({});
  const theme = useTheme();
  const [initialDayViewTab, setInitialDayViewTab] = useState<
    'overall' | 'category'
  >('overall');
  const [selectedCategoryForDayView, setSelectedCategoryForDayView] = useState<
    string | null
  >(null);

  const allCategories = new Set<string>();
  Object.values(rangeData).forEach(({ records }) => {
    records.forEach((record) => {
      allCategories.add(record.room_category);
    });
  });
  const categories = Array.from(allCategories);
  const sortedDates = Object.keys(rangeData).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  const categoryLineChartsData = categories.map((category) => {
    const occupancyPercentagePoints = sortedDates.map((date) => {
      const dayRecords = rangeData[date].records;
      const daySummary = rangeData[date].summary;
      const dayCategoryStats = getCategoryStatsForSingleDay(
        dayRecords,
        daySummary
      );
      return dayCategoryStats[category]
        ? dayCategoryStats[category].occupancyPercentage
        : 0;
    });
    const occupiedRoomsPoints = sortedDates.map((date) => {
      const dayRecords = rangeData[date].records;
      const daySummary = rangeData[date].summary;
      const dayCategoryStats = getCategoryStatsForSingleDay(
        dayRecords,
        daySummary
      );
      return dayCategoryStats[category]
        ? dayCategoryStats[category].occupiedRooms
        : 0;
    });
    return {
      category,
      labels: sortedDates,
      data: occupancyPercentagePoints,
      occupiedRooms: occupiedRoomsPoints,
    };
  });
  const aggregatedRangeOccupiedSum = sortedDates.reduce(
    (acc, date) => acc + (rangeData[date].summary.occupiedRooms || 0),
    0
  );
  const aggregatedRangeTotalSum = sortedDates.reduce(
    (acc, date) => acc + (rangeData[date].summary.totalRooms || 0),
    0
  );
  const overallSummary = {
    totalRooms: aggregatedRangeTotalSum,
    occupiedRooms: aggregatedRangeOccupiedSum,
    occupancyPercentage:
      aggregatedRangeTotalSum === 0
        ? 0
        : Math.round(
            (aggregatedRangeOccupiedSum / aggregatedRangeTotalSum) * 100
          ),
  };
  const aggregatedRecords: OccupancyRecord[] = sortedDates.flatMap(
    (dateKey) => rangeData[dateKey]?.records || []
  );
  const categorizedRooms = React.useMemo(
    () => aggregatedRecords,
    [aggregatedRecords]
  );
  const normalCheckInsCount = React.useMemo(
    () =>
      categorizedRooms.filter((room) => room.checkInCategory === 'normal')
        .length,
    [categorizedRooms]
  );
  const earlyCheckInsCount = React.useMemo(
    () =>
      categorizedRooms.filter((room) => room.checkInCategory === 'early')
        .length,
    [categorizedRooms]
  );
  const normalCheckOutsCount = React.useMemo(
    () =>
      categorizedRooms.filter(
        (room) => room.check_out_unixstamp && room.checkOutCategory === 'normal'
      ).length,
    [categorizedRooms]
  );
  const lateCheckOutsCount = React.useMemo(
    () =>
      categorizedRooms.filter(
        (room) => room.check_out_unixstamp && room.checkOutCategory === 'late'
      ).length,
    [categorizedRooms]
  );
  const aggregatedCategoryStats = React.useMemo(() => {
    const stats: Record<string, { occupiedRooms: number; totalRooms: number }> =
      {};
    sortedDates.forEach((date) => {
      const dayData = rangeData[date];
      if (!dayData) return;
      const dayStats = getCategoryStatsForSingleDay(
        dayData.records,
        dayData.summary
      );
      Object.entries(dayStats).forEach(([category, data]) => {
        if (!stats[category])
          stats[category] = { occupiedRooms: 0, totalRooms: 0 };
        stats[category].occupiedRooms += data.occupiedRooms;
        stats[category].totalRooms += data.totalRooms;
      });
    });
    const result: Record<
      string,
      { occupiedRooms: number; totalRooms: number; occupancyPercentage: number }
    > = {};
    Object.entries(stats).forEach(([category, data]) => {
      const occupancyPercentage =
        data.totalRooms === 0
          ? 0
          : Math.round((data.occupiedRooms / data.totalRooms) * 100);
      result[category] = { ...data, occupancyPercentage };
    });
    return result;
  }, [sortedDates, rangeData]);
  const occupiedCategories = Object.keys(aggregatedCategoryStats);
  const occupiedCounts = occupiedCategories.map(
    (category) => aggregatedCategoryStats[category].occupiedRooms
  );
  const vacantCount = overallSummary.totalRooms - overallSummary.occupiedRooms;
  const occupancyChartData = {
    labels: [...occupiedCategories, 'Vacant'],
    datasets: [
      {
        data: [...occupiedCounts, vacantCount],
        backgroundColor: [
          ...occupiedCategories.map((_, index) => {
            const colors = [
              theme.palette.primary.main,
              theme.palette.secondary.main,
              theme.palette.error.main,
              theme.palette.warning.main,
              theme.palette.info.main,
              theme.palette.success.main,
            ];
            return colors[index % colors.length];
          }),
          theme.palette.mode === 'dark' ? '#333' : '#e0e0e0',
        ],
        borderWidth: 0,
      },
    ],
  };

  const handleRangeTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRangeType: RangeType | null
  ) => {
    if (newRangeType) {
      setRangeType(newRangeType);
      const today = new Date();
      let newStart: Date;
      let newEnd: Date;
      switch (newRangeType) {
        case 'today':
          newStart = startOfDay(today);
          newEnd = startOfDay(today);
          break;
        case 'week':
          newStart = startOfWeek(today);
          newEnd = endOfWeek(today);
          break;
        case 'month':
          newStart = startOfMonth(today);
          newEnd = endOfMonth(today);
          break;
        default:
          return;
      }
      onDateRangeChange(newStart, newEnd);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    let newStart: Date;
    let newEnd: Date;
    switch (rangeType) {
      case 'today':
        newStart =
          direction === 'prev' ? subDays(startDate, 1) : addDays(startDate, 1);
        newEnd = newStart;
        break;
      case 'week':
        newStart =
          direction === 'prev'
            ? subWeeks(startDate, 1)
            : addWeeks(startDate, 1);
        newEnd = endOfWeek(newStart);
        break;
      case 'month':
        newStart =
          direction === 'prev'
            ? subMonths(startDate, 1)
            : addMonths(startDate, 1);
        newEnd = endOfMonth(newStart);
        break;
      default:
        return;
    }
    const today = new Date();
    if (rangeType === 'today' && isAfter(newStart, today)) return;
    if (rangeType === 'week') {
      const currentWeekStart = startOfWeek(today);
      if (isAfter(newStart, currentWeekStart)) return;
    }
    if (rangeType === 'month') {
      const currentMonthStart = startOfMonth(today);
      if (isAfter(newStart, currentMonthStart)) return;
    }
    onDateRangeChange(newStart, newEnd);
  };

  const handleChartClick = useCallback(
    (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const dataIndex = elements[0].index;
        const date = new Date(Object.keys(rangeData)[dataIndex]);
        setSelectedDate(date);
        setInitialDayViewTab('overall');
        setSelectedCategoryForDayView(null);
      }
    },
    [rangeData]
  );

  const handleCategoryChartClick =
    (category: string) => (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const dataIndex = elements[0].index;
        const date = new Date(Object.keys(rangeData)[dataIndex]);
        setSelectedDate(date);
        setInitialDayViewTab('category');
        setSelectedCategoryForDayView(category);
      }
    };

  const chartData = {
    labels: Object.keys(rangeData).map((date) =>
      format(new Date(date), 'MMM d')
    ),
    datasets: [
      {
        label: 'Occupancy %',
        data: Object.values(rangeData).map(
          (data) => data.summary.occupancyPercentage
        ),
        borderColor: theme.palette.primary.main,
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'rgba(144, 202, 249, 0.15)'
            : 'rgba(25, 118, 210, 0.1)',
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
        pointBorderColor: theme.palette.primary.main,
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  const overallOccupiedRooms = Object.values(rangeData).map(
    (data) => data.summary.occupiedRooms
  );
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const date = Object.keys(rangeData)[context.dataIndex];
            const data = rangeData[date];
            return [
              `Occupancy: ${data.summary.occupancyPercentage}%`,
              `Rooms: ${data.summary.occupiedRooms}/${data.summary.totalRooms}`,
            ];
          },
        },
      },
      datalabels: {
        display: true,
        align: 'top',
        formatter: function (_value: any, context: any) {
          return overallOccupiedRooms[context.dataIndex];
        },
        color: theme.palette.text.primary,
        font: { weight: '600', size: 12 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          display: true,
          color: theme.palette.divider,
          drawBorder: false,
          borderDash: [5, 5],
        },
        ticks: {
          color: theme.palette.text.secondary,
          padding: 10,
          callback: (value: number) => `${value}%`,
        },
        border: { display: false },
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: theme.palette.text.secondary, padding: 10 },
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

  if (Object.keys(rangeData).length === 0) {
    return (
      <Alert severity="info">
        No occupancy data available for the selected date range.
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={rangeType}
            exclusive
            onChange={handleRangeTypeChange}
            aria-label="date range type"
            sx={componentStyles.dayView.toggleButtonGroup(theme)}
          >
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>

      <Grid container>
        <Grid item xs={12}>
          <Card sx={{ position: 'relative' }}>
            <CardContent>
              <Tooltip
                title={
                  selectedView === 'graph'
                    ? 'Switch to Doughnut View'
                    : 'Switch to Graph View'
                }
              >
                <IconButton
                  onClick={() =>
                    setSelectedView(
                      selectedView === 'graph' ? 'doughnut' : 'graph'
                    )
                  }
                  sx={{ position: 'absolute', top: 16, right: 16 }}
                  aria-label={
                    selectedView === 'graph'
                      ? 'Switch to Doughnut View'
                      : 'Switch to Graph View'
                  }
                >
                  {selectedView === 'graph' ? <PieChart /> : <LineChart />}
                </IconButton>
              </Tooltip>

              <Box textAlign="center" sx={{ mb: 2 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {rangeType === 'week'
                    ? 'Weekly Occupancy'
                    : 'Monthly Occupancy'}
                </Typography>
              </Box>

              <Box sx={componentStyles.rangeView.navigationBox}>
                <Box display="flex" alignItems="center" gap={1}>
                  <IconButton onClick={() => handleNavigate('prev')}>
                    <ChevronLeft />
                  </IconButton>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {rangeType === 'week'
                      ? `Week of ${format(startDate, 'MMM d')}`
                      : format(startDate, 'MMMM yyyy')}
                  </Typography>
                  <IconButton onClick={() => handleNavigate('next')}>
                    <ChevronRight />
                  </IconButton>
                </Box>
                <DatePicker
                  label={rangeType === 'month' ? 'Select Month' : 'Select Week'}
                  openTo={rangeType === 'month' ? 'month' : 'day'}
                  value={startDate}
                  onChange={(date) => {
                    if (date) {
                      let newStart: Date;
                      let newEnd: Date;
                      switch (rangeType) {
                        case 'week':
                          newStart = startOfWeek(date);
                          newEnd = endOfWeek(date);
                          break;
                        case 'month':
                          newStart = startOfMonth(date);
                          newEnd = endOfMonth(date);
                          break;
                        default:
                          return;
                      }
                      onDateRangeChange(newStart, newEnd);
                    }
                  }}
                  views={rangeType === 'month' ? ['year', 'month'] : undefined}
                  disableFuture
                />
              </Box>

              {selectedView === 'doughnut' ? (
                <>
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
                            {aggregatedRangeOccupiedSum}
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
                          <Typography variant="body2">Rooms Vacant:</Typography>
                          <Typography variant="h6">
                            {aggregatedRangeTotalSum -
                              aggregatedRangeOccupiedSum}
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
                      <Box sx={componentStyles.rangeView.doughnutContainer}>
                        <Doughnut
                          data={occupancyChartData}
                          options={{
                            cutout: '70%',
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: { color: theme.palette.text.primary },
                              },
                              centerText: {
                                display: true,
                                text: `${overallSummary.occupancyPercentage}%`,
                                color: theme.palette.text.primary,
                                font: { weight: '600', size: 24 },
                              },
                              datalabels: { display: false },
                            },
                          }}
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
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mt: 2 }}
                  >
                    {rangeType === 'week'
                      ? `Weekly Occupancy: ${aggregatedRangeOccupiedSum} / ${aggregatedRangeTotalSum} Rooms Occupied`
                      : `Monthly Occupancy: ${aggregatedRangeOccupiedSum} / ${aggregatedRangeTotalSum} Rooms Occupied`}
                  </Typography>
                </>
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
                  <Line data={chartData} options={chartOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
          {categoryLineChartsData.map(
            ({ category, labels, data, occupiedRooms }) => {
              // Update the dataset label to remove the percentage symbol in Graph view
              const catChartData = {
                labels: labels.map((d) => format(new Date(d), 'MMM d')),
                datasets: [
                  {
                    label: `${category} Occupancy`,
                    data,
                    occupiedRooms,
                    borderColor: theme.palette.primary.main,
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(144, 202, 249, 0.15)'
                        : 'rgba(25, 118, 210, 0.1)',
                    fill: {
                      target: 'origin',
                      above:
                        theme.palette.mode === 'dark'
                          ? 'rgba(144, 202, 249, 0.15)'
                          : 'rgba(25, 118, 210, 0.1)',
                    },
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: theme.palette.primary.main,
                    pointBorderWidth: 2,
                    borderWidth: 2,
                  },
                ],
              };
              const catDoughnutData = {
                labels: ['Occupied', 'Vacant'],
                datasets: [
                  {
                    data: [
                      aggregatedCategoryStats[category]?.occupiedRooms || 0,
                      (aggregatedCategoryStats[category]?.totalRooms || 0) -
                        (aggregatedCategoryStats[category]?.occupiedRooms || 0),
                    ],
                    backgroundColor: [
                      theme.palette.primary.main,
                      theme.palette.mode === 'dark' ? '#333' : '#e0e0e0',
                    ],
                    borderWidth: 0,
                  },
                ],
              };
              const catDoughnutOptions = {
                cutout: '70%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: theme.palette.text.primary },
                  },
                  centerText: {
                    display: true,
                    text: `${
                      aggregatedCategoryStats[category]?.occupancyPercentage ||
                      0
                    }%`,
                    color: theme.palette.text.primary,
                    font: { weight: '600', size: 24 },
                  },
                  datalabels: { display: false },
                },
              };
              // New options for Graph view: no percentage in labels and with data labels along the line
              const catGraphOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: theme.palette.background.paper,
                    titleColor: theme.palette.text.primary,
                    bodyColor: theme.palette.text.secondary,
                    borderColor: theme.palette.divider,
                    borderWidth: 1,
                    padding: 8,
                    callbacks: {
                      label: (context: any) => `Occupancy: ${context.raw}`,
                    },
                  },
                  datalabels: {
                    display: true,
                    align: 'top',
                    formatter: (value: number) => value,
                    color: theme.palette.text.primary,
                    font: { weight: '600', size: 12 },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                      display: true,
                      color: theme.palette.divider,
                      drawBorder: false,
                      borderDash: [5, 5],
                    },
                    ticks: {
                      color: theme.palette.text.secondary,
                      padding: 8,
                      callback: (value: number) => `${value}`,
                    },
                    border: { display: false },
                  },
                  x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: theme.palette.text.secondary, padding: 8 },
                    border: { display: false },
                  },
                },
                onClick: handleCategoryChartClick(category),
              };
              const currentView = categoryViews[category] || 'graph';
              return (
                <Grid
                  item
                  xs={12}
                  {...(rangeType === 'month'
                    ? { sm: 12, md: 12 }
                    : { sm: 6, md: 4 })}
                  key={category}
                >
                  <Card sx={{ position: 'relative' }}>
                    <IconButton
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                      onClick={() => {
                        const newView =
                          currentView === 'graph' ? 'doughnut' : 'graph';
                        setCategoryViews((prev) => ({
                          ...prev,
                          [category]: newView,
                        }));
                      }}
                      aria-label={
                        currentView === 'graph'
                          ? 'Switch to Doughnut View'
                          : 'Switch to Graph View'
                      }
                    >
                      {currentView === 'graph' ? <PieChart /> : <LineChart />}
                    </IconButton>
                    <CardContent>
                      <Typography
                        textAlign="center"
                        variant="h6"
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        {category} Occupancy
                      </Typography>
                      <Box
                        sx={{
                          height:
                            rangeType === 'month' && currentView === 'graph'
                              ? 450
                              : 200,
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: 2,
                          '& canvas':
                            currentView === 'graph'
                              ? { width: '100% !important' }
                              : { height: '100% !important' },
                        }}
                      >
                        {currentView === 'graph' ? (
                          <Line data={catChartData} options={catGraphOptions} />
                        ) : (
                          <Doughnut
                            data={catDoughnutData}
                            options={catDoughnutOptions}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            }
          )}
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                textAlign="center"
                gutterBottom
                sx={{ fontWeight: 600, mb: 2 }}
              >
                Day-wise Summary
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(rangeData).map(([date, data]) => (
                  <Grid item xs={12} sm={6} md={4} key={date}>
                    <Box
                      p={2}
                      border={1}
                      borderColor="divider"
                      borderRadius={1}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => setSelectedDate(new Date(date))}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        {format(new Date(date), 'MMMM d, yyyy')}
                      </Typography>
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{ fontWeight: 600 }}
                      >
                        {data.summary.occupancyPercentage}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {data.summary.occupiedRooms} / {data.summary.totalRooms}{' '}
                        Rooms
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        fullWidth
        maxWidth="lg"
        open={!!selectedDate}
        onClose={() => {
          setSelectedDate(null);
          setInitialDayViewTab('overall');
          setSelectedCategoryForDayView(null);
        }}
        PaperProps={{ sx: { bgcolor: theme.palette.background.paper } }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="flex-end">
            <IconButton
              onClick={() => {
                setSelectedDate(null);
                setInitialDayViewTab('overall');
                setSelectedCategoryForDayView(null);
              }}
            >
              <X />
            </IconButton>
          </Box>
          {selectedDate && rangeData[format(selectedDate, 'yyyy-MM-dd')] && (
            <DayView
              date={selectedDate}
              occupancyData={
                rangeData[format(selectedDate, 'yyyy-MM-dd')].records
              }
              summary={rangeData[format(selectedDate, 'yyyy-MM-dd')].summary}
              loading={false}
              onDateChange={(newDate: Date) => setSelectedDate(newDate)}
              initialViewTab={initialDayViewTab}
              initialCategoryFilter={selectedCategoryForDayView || undefined}
            />
          )}
        </Box>
      </Dialog>

      <Dialog
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        PaperProps={{ sx: { bgcolor: theme.palette.background.paper } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Select {rangeType === 'month' ? 'Month' : 'Week'}
          </Typography>
          <DatePicker
            label={rangeType === 'month' ? 'Month' : 'Week'}
            value={startDate}
            onChange={(date) => {
              if (date) {
                let newStart: Date;
                let newEnd: Date;
                switch (rangeType) {
                  case 'week':
                    newStart = startOfWeek(date);
                    newEnd = endOfWeek(date);
                    break;
                  case 'month':
                    newStart = startOfMonth(date);
                    newEnd = endOfMonth(date);
                    break;
                  default:
                    return;
                }
                onDateRangeChange(newStart, newEnd);
                setShowDatePicker(false);
              }
            }}
            views={rangeType === 'month' ? ['year', 'month'] : undefined}
            disableFuture
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default RangeView;
