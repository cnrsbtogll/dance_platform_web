import { createTheme } from '@mui/material/styles';

// Dans platformu için tema
const createAppTheme = (mode: 'light' | 'dark' = 'light') => createTheme({
  palette: {
    mode,
    primary: {
      main: '#ED3D81',
      light: '#f0639a',
      dark: '#c12d65',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#3B1F2B',
      light: '#5a3142',
      dark: '#25131b',
      contrastText: '#ffffff',
    },
    error: { main: '#f44336' },
    warning: { main: '#ff9800' },
    info: { main: '#2196f3' },
    success: { main: '#4caf50' },
    background: {
      default: mode === 'dark' ? '#0f172a' : '#f5f5f5',
      paper: mode === 'dark' ? '#1e293b' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#f1f5f9' : '#333333',
      secondary: mode === 'dark' ? '#94a3b8' : '#666666',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          padding: '8px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #ED3D81 0%, #E91E63 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #ED3D81 30%, #E91E63 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&.Mui-focused fieldset': {
              borderColor: mode === 'dark' ? '#94a3b8' : '#111827',
            },
          },
          '& label.Mui-focused': {
            color: mode === 'dark' ? '#94a3b8' : '#111827',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? '#64748b' : '#9CA3AF',
          },
        },
        notchedOutline: {
          borderColor: mode === 'dark' ? '#475569' : '#E5E7EB',
        },
        input: {
          color: mode === 'dark' ? '#f1f5f9' : '#333333',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? '#94a3b8' : '#6B7280',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? '#f1f5f9' : '#333333',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? '#cbd5e1' : '#374151',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: mode === 'dark' ? '#1e293b' : '#fdf2f8',
            color: mode === 'dark' ? '#f1f5f9' : '#333333',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: mode === 'dark' ? '#334155' : '#E5E7EB',
          color: mode === 'dark' ? '#cbd5e1' : '#374151',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: mode === 'dark' ? 'rgba(148, 163, 184, 0.05)' : 'rgba(237, 61, 129, 0.04)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: mode === 'dark' ? '#334155' : '#E5E7EB',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '&.MuiChip-colorDefault': {
            backgroundColor: mode === 'dark' ? '#334155' : undefined,
            color: mode === 'dark' ? '#cbd5e1' : undefined,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          color: mode === 'dark' ? '#f1f5f9' : '#333333',
        },
        icon: {
          color: mode === 'dark' ? '#94a3b8' : undefined,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: mode === 'dark' ? '#334155' : undefined,
          },
        },
      },
    },
  },
});

export default createAppTheme;