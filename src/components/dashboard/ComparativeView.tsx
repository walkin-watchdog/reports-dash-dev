import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format, differenceInCalendarDays, addDays } from 'date-fns';
import { OccupancyRecord } from '../../types/api';
import { componentStyles } from '../../theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface ComparativeViewProps {
  range1?: { startDate: Date; endDate: Date };
  range2?: { startDate: Date; endDate: Date };
  data1: {
    records: OccupancyRecord[];
    summary: {
      totalRooms: number;
      occupiedRooms: number;
      occupancyPercentage: number;
    };
  } | null;
  data2: {
    records: OccupancyRecord[];
    summary: {
      totalRooms: number;
      occupiedRooms: number;
      occupancyPercentage: number;
    };
  } | null;
  onRangeChange: (
    range: { startDate: Date; endDate: Date },
    rangeNum: 1 | 2
  ) => void;
  loading: boolean;
}

const ComparativeView: React.FC<ComparativeViewProps> = (props) => {
  const today = new Date();
  const theme = useTheme();
  const defaultRange1 = {
    startDate: addDays(today, -7),
    endDate: addDays(today, -1),
  };
  const defaultRange2 = {
    startDate: addDays(today, -14),
    endDate: addDays(today, -8),
  };
  const {
    range1 = defaultRange1,
    range2 = defaultRange2,
    data1,
    data2,
    onRangeChange,
    loading,
  } = props;
  const label1 = `${format(range1.startDate, 'MMM d')} - ${format(
    range1.endDate,
    'MMM d, yyyy'
  )}`;
  const label2 = `${format(range2.startDate, 'MMM d')} - ${format(
    range2.endDate,
    'MMM d, yyyy'
  )}`;
  const days1 = differenceInCalendarDays(range1.endDate, range1.startDate) + 1;
  const days2 = differenceInCalendarDays(range2.endDate, range2.startDate) + 1;

  const getDailyOccupancy = (
    records: OccupancyRecord[],
    startDate: Date,
    numDays: number
  ): number[] => {
    const occupancyByDay: Record<string, number> = {};
    for (let i = 0; i < numDays; i++) {
      const d = addDays(startDate, i);
      const key = format(d, 'yyyy-MM-dd');
      occupancyByDay[key] = 0;
    }
    records.forEach((record) => {
      const recordDate = new Date(record.check_in_unixstamp * 1000);
      if (
        recordDate >= startDate &&
        recordDate <= addDays(startDate, numDays - 1)
      ) {
        const key = format(recordDate, 'yyyy-MM-dd');
        if (occupancyByDay[key] !== undefined) {
          occupancyByDay[key] += 1;
        }
      }
    });
    return Array.from({ length: numDays }, (_, i) => {
      const d = addDays(startDate, i);
      const key = format(d, 'yyyy-MM-dd');
      return occupancyByDay[key];
    });
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

  // We use days1 for the chart. (If ranges differ, the overlays will notify the user.)
  const daysCount = days1;
  const xLabels = Array.from({ length: daysCount }, (_, i) => `Day ${i + 1}`);
  const occupancyData1 = data1
    ? getDailyOccupancy(data1.records, range1.startDate, daysCount)
    : Array(daysCount).fill(0);
  const occupancyData2 = data2
    ? getDailyOccupancy(data2.records, range2.startDate, daysCount)
    : Array(daysCount).fill(0);
  const chartData = {
    labels: xLabels,
    datasets: [
      {
        label: label1,
        data: occupancyData1,
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
        label: label2,
        data: occupancyData2,
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
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      title: {
        display: true,
        text: 'Occupancy Comparison (Daily Occupied Rooms)',
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
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Occupied Rooms' },
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
      x: {
        title: {
          display: false,
          text: 'Day',
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
    },
  };

  return (
    <Grid container spacing={3}>
      {/* Main Card with DatePickers and Chart */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box textAlign="center">
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 600, mb: 2 }}
              >
                Compare Occupancy
              </Typography>
            </Box>
            {/* DatePickers remain uncovered */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                mt: 2,
              }}
            >
              <Grid>
                <DatePicker
                  label="Start Date"
                  value={range1.startDate}
                  onChange={(date) =>
                    date &&
                    onRangeChange(
                      { startDate: date, endDate: range1.endDate },
                      1
                    )
                  }
                  disableFuture
                />
                <DatePicker
                  label="End Date"
                  value={range1.endDate}
                  onChange={(date) =>
                    date &&
                    onRangeChange(
                      { startDate: range1.startDate, endDate: date },
                      1
                    )
                  }
                  disableFuture
                />
              </Grid>
              <Grid>
                <DatePicker
                  label="Start Date"
                  value={range2.startDate}
                  onChange={(date) =>
                    date &&
                    onRangeChange(
                      { startDate: date, endDate: range2.endDate },
                      2
                    )
                  }
                  disableFuture
                />
                <DatePicker
                  label="End Date"
                  value={range2.endDate}
                  onChange={(date) =>
                    date &&
                    onRangeChange(
                      { startDate: range2.startDate, endDate: date },
                      2
                    )
                  }
                  disableFuture
                />
              </Grid>
            </Box>
            {/* Chart Container (overlay covers only this area) */}
            <Box sx={{ position: 'relative' }}>
              <Box sx={componentStyles.comparativeView.chartContainer}>
                <Line data={chartData} options={chartOptions} />
              </Box>
              {days1 !== days2 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 10,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 2,
                  }}
                >
                  <Typography variant="h6" color="error" align="center">
                    Both ranges must have the same length for comparison. Please
                    adjust the date ranges.
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      {/* Summary Card for Range 1 */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ position: 'relative' }}>
              <Typography
                variant="h4"
                gutterBottom
                color="primary"
                textAlign="center"
              >
                {`${format(range1.startDate, 'MMMM d')} - ${format(
                  range1.endDate,
                  'MMMM d, yyyy'
                )}`}
              </Typography>
              {data1 && (
                <>
                  <Typography variant="h6" mt={2}>
                    {data1.summary.occupiedRooms} / {data1.summary.totalRooms}{' '}
                    Rooms Occupied
                  </Typography>
                  <Box mt={1}>
                    {Object.entries(
                      data1.records.reduce((acc, room) => {
                        acc[room.room_category] =
                          (acc[room.room_category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([category, count]) => (
                      <Typography key={category} variant="subtitle1">
                        {category}: {count} rooms
                      </Typography>
                    ))}
                  </Box>
                </>
              )}
              {days1 !== days2 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 10,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 2,
                  }}
                >
                  <Typography variant="h6" color="error" align="center">
                    Both ranges must have the same length for comparison. Please
                    adjust the date ranges.
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      {/* Summary Card for Range 2 */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ position: 'relative' }}>
              <Typography
                variant="h4"
                gutterBottom
                color="primary"
                textAlign="center"
              >
                {`${format(range2.startDate, 'MMMM d')} - ${format(
                  range2.endDate,
                  'MMMM d, yyyy'
                )}`}
              </Typography>
              {data2 && (
                <>
                  <Typography variant="h6" mt={2}>
                    {data2.summary.occupiedRooms} / {data2.summary.totalRooms}{' '}
                    Rooms Occupied
                  </Typography>
                  <Box mt={1}>
                    {Object.entries(
                      data2.records.reduce((acc, room) => {
                        acc[room.room_category] =
                          (acc[room.room_category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([category, count]) => (
                      <Typography key={category} variant="subtitle1">
                        {category}: {count} rooms
                      </Typography>
                    ))}
                  </Box>
                </>
              )}
              {days1 !== days2 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 10,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 2,
                  }}
                >
                  <Typography variant="h6" color="error" align="center">
                    Both ranges must have the same length for comparison. Please
                    adjust the date ranges.
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ComparativeView;
