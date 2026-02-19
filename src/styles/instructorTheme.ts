import { createTheme } from '@mui/material/styles';

// Eğitmen paneli için özel tema - #005f73 teal renk paleti
const instructorTheme = createTheme({
    palette: {
        primary: {
            main: '#005f73',
            light: '#0a9396',
            dark: '#003d4a',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#94d2bd',
            light: '#b8e1d5',
            dark: '#5faf97',
            contrastText: '#003d4a',
        },
        error: {
            main: '#f44336',
        },
        warning: {
            main: '#ff9800',
        },
        info: {
            main: '#0a9396',
        },
        success: {
            main: '#4caf50',
        },
        background: {
            default: '#f5f5f5',
            paper: '#ffffff',
        },
        text: {
            primary: '#333333',
            secondary: '#666666',
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
    shape: {
        borderRadius: 8,
    },
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
                    background: 'linear-gradient(135deg, #005f73 0%, #0a9396 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #003d4a 0%, #005f73 100%)',
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
                            borderColor: '#005f73',
                        },
                    },
                    '& label.Mui-focused': {
                        color: '#005f73',
                    },
                },
            },
        },
    },
});

export default instructorTheme;
