import { createTheme } from '@mui/material/styles';

// Dans Okulu paneli için özel tema - amber-700 / yellow-900 renk paleti
const createSchoolTheme = (mode: 'light' | 'dark' = 'light') => createTheme({
    palette: {
        mode,
        primary: {
            main: '#b45309',       // amber-700
            light: '#d97706',      // amber-600
            dark: '#713f12',       // yellow-900
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#fde68a',       // amber-200
            light: '#fef3c7',      // amber-100
            dark: '#f59e0b',       // amber-500
            contrastText: '#713f12',
        },
        error: { main: '#f44336' },
        warning: { main: '#ff9800' },
        info: { main: '#d97706' },
        success: { main: '#4caf50' },
        background: {
            default: mode === 'dark' ? '#1a120b' : '#fffbeb',
            paper: mode === 'dark' ? '#231810' : '#ffffff',
        },
        text: {
            primary: mode === 'dark' ? '#ffffff' : '#333333',
            secondary: mode === 'dark' ? '#cba990' : '#666666',
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
                    background: 'linear-gradient(135deg, #b45309 0%, #713f12 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
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
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        '&.Mui-focused fieldset': {
                            borderColor: '#b45309',
                        },
                    },
                    '& label.Mui-focused': {
                        color: '#b45309',
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'dark' ? '#1a120b' : '#ffffff',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: mode === 'dark' ? '#cba990' : '#9CA3AF',
                    },
                    '&.Mui-disabled': {
                        backgroundColor: mode === 'dark' ? '#231810' : '#f9fafb',
                    },
                    '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                        borderColor: mode === 'dark' ? '#3e2a1b' : '#E5E7EB',
                    },
                },
                notchedOutline: {
                    borderColor: mode === 'dark' ? '#493322' : '#E5E7EB',
                },
                input: {
                    color: mode === 'dark' ? '#ffffff' : '#333333',
                    '&.Mui-disabled': {
                        WebkitTextFillColor: mode === 'dark' ? '#8e715b' : '#9CA3AF',
                        color: mode === 'dark' ? '#8e715b' : '#9CA3AF',
                    },
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: mode === 'dark' ? '#cba990' : '#6B7280',
                    '&.Mui-disabled': {
                        color: mode === 'dark' ? '#8e715b' : '#9CA3AF',
                    },
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                select: {
                    color: mode === 'dark' ? '#ffffff' : '#333333',
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
        MuiTableHead: {
            styleOverrides: {
                root: {
                    '& .MuiTableCell-root': {
                        backgroundColor: mode === 'dark' ? '#231810' : '#fffbeb',
                        color: mode === 'dark' ? '#cba990' : '#333333',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottomColor: mode === 'dark' ? '#493322' : '#E5E7EB',
                    color: mode === 'dark' ? '#ffffff' : '#374151',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: mode === 'dark' ? 'rgba(73, 51, 34, 0.3)' : 'rgba(180, 83, 9, 0.04)',
                    },
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: mode === 'dark' ? '#493322' : '#E5E7EB',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    '&.MuiChip-colorDefault': {
                        backgroundColor: mode === 'dark' ? '#493322' : undefined,
                        color: mode === 'dark' ? '#ffffff' : undefined,
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: mode === 'dark' ? '#231810' : '#ffffff',
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    color: mode === 'dark' ? '#ffffff' : '#333333',
                },
            },
        },
        MuiDialogContent: {
            styleOverrides: {
                root: {
                    color: mode === 'dark' ? '#cba990' : '#374151',
                },
            },
        },
    },
});

export default createSchoolTheme;
