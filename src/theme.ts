import { createTheme, Theme } from '@mui/material/styles';

const getTheme = (mode: 'light' | 'dark'): Theme =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#1976d2' : '#6366F1', // dark mode: indigo-500
        light: mode === 'light' ? '#42a5f5' : '#a5b4fc', // dark mode: indigo-300
        dark: mode === 'light' ? '#1565c0' : '#4338ca', // dark mode: indigo-700
        contrastText: '#ffffff',
      },
      secondary: {
        main: mode === 'light' ? '#9c27b0' : '#a1a1aa', // dark mode: using zinc-400
        light: mode === 'light' ? '#ba68c8' : '#d4d4d8', // dark mode: using zinc-300
        dark: mode === 'light' ? '#7b1fa2' : '#71717a', // dark mode: using zinc-500
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#18181b', // dark mode: zinc-900
        paper: mode === 'light' ? '#ffffff' : '#27272a', // dark mode: zinc-800
      },
      text: {
        primary: mode === 'light' ? '#1e293b' : '#e4e4e7', // dark mode: zinc-200
        secondary: mode === 'light' ? '#64748b' : '#a1a1aa', // dark mode: zinc-400
      },
      divider:
        mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      action: {
        active:
          mode === 'light' ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.7)',
        hover:
          mode === 'light'
            ? 'rgba(0, 0, 0, 0.04)'
            : 'rgba(255, 255, 255, 0.08)',
        selected:
          mode === 'light'
            ? 'rgba(0, 0, 0, 0.08)'
            : 'rgba(255, 255, 255, 0.16)',
        disabled:
          mode === 'light' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)',
        disabledBackground:
          mode === 'light'
            ? 'rgba(0, 0, 0, 0.12)'
            : 'rgba(255, 255, 255, 0.12)',
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
      },
      subtitle1: { fontSize: '1rem', fontWeight: 500, letterSpacing: 0 },
      subtitle2: { fontSize: '0.875rem', fontWeight: 500, letterSpacing: 0 },
      body1: { fontSize: '1rem', letterSpacing: 0 },
      body2: { fontSize: '0.875rem', letterSpacing: 0 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor:
              mode === 'light' ? '#90caf9 #f5f5f5' : '#3f3f46 #52525b', // dark mode: thumb = zinc-700, track = zinc-600
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
              background: mode === 'light' ? '#f5f5f5' : '#52525b',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              backgroundColor: mode === 'light' ? '#90caf9' : '#3f3f46',
              borderRadius: '4px',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background:
              mode === 'light'
                ? 'linear-gradient(145deg, #1976d2, #1565c0)'
                : 'linear-gradient(145deg, #18181b, #27272a)', // dark mode: using zinc-900 to zinc-800 gradient
            boxShadow:
              mode === 'light'
                ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                : '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            padding: '8px 16px',
            transition: 'all 0.2s ease-in-out',
          },
          contained: {
            boxShadow:
              mode === 'light'
                ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                : '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
            '&:hover': {
              boxShadow:
                mode === 'light'
                  ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                  : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
            },
          },
          outlined: {
            borderColor:
              mode === 'light'
                ? 'rgba(0, 0, 0, 0.23)'
                : 'rgba(255, 255, 255, 0.23)',
            '&:hover': {
              borderColor:
                mode === 'light'
                  ? 'rgba(0, 0, 0, 0.87)'
                  : 'rgba(255, 255, 255, 0.87)',
              backgroundColor:
                mode === 'light'
                  ? 'rgba(0, 0, 0, 0.04)'
                  : 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            background: mode === 'light' ? '#ffffff' : '#27272a', // dark mode: use zinc-800 for cards
            boxShadow:
              mode === 'light'
                ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                : '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
            border:
              mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow:
                mode === 'light'
                  ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                  : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.1)',
              backgroundColor:
                mode === 'light'
                  ? 'rgba(0, 0, 0, 0.04)'
                  : 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            minWidth: 120,
            transition: 'all 0.2s ease-in-out',
            '&.Mui-selected': {
              color: mode === 'light' ? '#1976d2' : '#6366F1',
            },
            '&:hover': {
              color: mode === 'light' ? '#1976d2' : '#6366F1',
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '3px',
                backgroundColor: mode === 'light' ? '#ffffff' : '#6366F1',
                borderRadius: '3px 3px 0 0',
                transform: 'scaleX(0.7)',
                transition: 'transform 0.2s ease-in-out',
              },
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: '3px 3px 0 0',
            backgroundColor: mode === 'light' ? '#1976d2' : '#6366F1',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                '& fieldset': {
                  borderColor: mode === 'light' ? '#1976d2' : '#6366F1',
                },
              },
              '&.Mui-focused': {
                '& fieldset': {
                  borderColor: mode === 'light' ? '#1976d2' : '#6366F1',
                  borderWidth: 2,
                },
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          outlined: {
            borderRadius: 8,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: '16px 16px 0 0',
            background: mode === 'light' ? '#ffffff' : '#27272a', // dark mode: drawer background uses zinc-800
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
          filled: {
            backgroundColor:
              mode === 'light'
                ? 'rgba(0, 0, 0, 0.08)'
                : 'rgba(255, 255, 255, 0.16)',
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&:hover': {
              backgroundColor:
                mode === 'light'
                  ? 'rgba(0, 0, 0, 0.04)'
                  : 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
      },
      MuiPagination: {
        styleOverrides: {
          root: {
            '& .MuiPaginationItem-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  });

const componentStyles = {
  dashboard: {
    main: { flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' },
    logo: {
      height: 100,
      width: 'auto',
      mr: 2,
      transition: 'transform 0.2s',
      '&:hover': { transform: 'scale(1.1)' },
    },
    title: { flexGrow: 1, fontWeight: 600 },
    headerActions: { display: 'flex', gap: 2, alignItems: 'center' },
    tabs: {
      '& .MuiTab-root': {
        color: 'inherit',
        '&.Mui-selected': { opacity: 1, color: 'inherit' },
      },
      '& .MuiTabs-indicator': { backgroundColor: 'currentColor' },
    },
    drawerPaper: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '80vh',
      bgcolor: 'background.paper',
    },
  },
  dayView: {
    tabPanel: { py: 3 },
    toggleButtonGroup: (theme: Theme) => ({
      '& .MuiToggleButton-root': {
        borderColor:
          theme.palette.mode === 'light'
            ? 'rgba(0,0,0,0.23)'
            : 'rgba(255,255,255,0.23)',
        borderRadius: 0,
        textTransform: 'none',
        fontWeight: 600,
        padding: '8px 16px',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor:
            theme.palette.mode === 'light'
              ? 'rgba(0,0,0,0.87)'
              : 'rgba(255,255,255,0.87)',
          backgroundColor: theme.palette.action.hover,
        },
        '&.Mui-selected': {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          boxShadow:
            theme.palette.mode === 'light'
              ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              : '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
          },
        },
      },
    }),
    errorChip: (theme: Theme) => ({
      backgroundColor:
        theme.palette.mode === 'light'
          ? theme.palette.primary.main
          : theme.palette.primary.main,
      color: theme.palette.error.contrastText,
      fontWeight: 600,
      mr: 1,
    }),
    earlyChip: (theme: Theme) => ({
      backgroundColor:
        theme.palette.mode === 'light' ? theme.palette.warning.main : '#f59e0b',
      color: theme.palette.warning.contrastText,
      mr: 0.5,
      fontWeight: 600,
    }),
    lateChip: (theme: Theme) => ({
      backgroundColor:
        theme.palette.mode === 'light' ? theme.palette.error.main : '#dc2626',
      color: theme.palette.error.contrastText,
      fontWeight: 600,
    }),
  },
  hotelSearch: {
    textField: (isMobile: boolean, mode: 'light' | 'dark') => ({
      width: '100%',
      '& .MuiOutlinedInput-root': {
        backgroundColor: mode === 'light' ? '#ffffff' : 'rgba(255,255,255,0.1)',
        '&:hover': {
          backgroundColor:
            mode === 'light' ? '#ffffff' : 'rgba(255,255,255,0.2)',
        },
        '& fieldset': { borderColor: 'transparent' },
      },
      '& .MuiInputBase-input': { color: 'inherit' },
    }),
    formControl: (isMobile: boolean, mode: 'light' | 'dark') => ({
      minWidth: isMobile ? '100%' : 200,
      '& .MuiOutlinedInput-root': {
        backgroundColor: mode === 'light' ? '#ffffff' : 'rgba(255,255,255,0.1)',
        '&:hover': {
          backgroundColor:
            mode === 'light' ? '#ffffff' : 'rgba(255,255,255,0.2)',
        },
        '& fieldset': { borderColor: 'transparent' },
      },
      '& .MuiSelect-select': { color: 'inherit' },
    }),
    popperPaper: {
      mt: 1,
      maxHeight: 300,
      overflow: 'auto',
      border: '1px solid',
      borderColor: 'divider',
    },
  },
  comparativeView: {
    chartContainer: {
      height: 600,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
      '& canvas': { width: '100% !important' },
    },
  },
  rangeView: {
    navigationBox: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 3,
    },
    doughnutContainer: {
      height: 300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    daySummaryBox: {
      p: 2,
      border: 1,
      borderColor: 'divider',
      borderRadius: 1,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)' },
    },
  },
  errorBoundary: {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
    },
    content: { textAlign: 'center' },
    reloadButton: { mt: 2 },
  },
  errorPage: {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 2,
    },
    content: { textAlign: 'center' },
    button: { mt: 2 },
  },
  skipLink: {
    position: 'absolute',
    left: '-9999px',
    zIndex: 9999,
    '&:focus': {
      left: '50%',
      transform: 'translateX(-50%)',
      top: '8px',
      backgroundColor: 'primary.main',
      color: 'white',
    },
  },
  forgotPassword: {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 2,
    },
    card: { maxWidth: 400, width: '100%' },
  },
  loginPage: {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 2,
    },
    card: { maxWidth: 400, width: '100%' },
    logo: {
      borderRadius: '50%',
      width: 120,
      height: 120,
      mb: 1,
      display: 'inline-block',
    },
    hotelIcon: { mb: 1, display: 'inline-block' },
    title: { mt: 1, fontWeight: 'bold' },
    subtitle: { mt: 1 },
  },
};

export { getTheme, componentStyles };
