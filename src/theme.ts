import { createTheme } from '@mui/material/styles';

export const ibreneTheme = createTheme({
    palette: {
        primary: {
            main: '#2563eb', // Brand blue
            light: '#3b82f6',
            dark: '#1d4ed8',
        },
        secondary: {
            main: '#10b981', // Accent/success green
            light: '#34d399',
            dark: '#059669',
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff',
        },
        error: {
            main: '#dc2626',
        },
        text: {
            primary: '#1e293b',
            secondary: '#64748b',
        },
    },
    typography: {
        fontFamily: [
            'Roboto',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Arial',
            'sans-serif',
        ].join(','),
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 700,
        },
        h3: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none', // Prevent all-caps buttons by default
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 8, // Default border radius for components
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    borderRadius: 16,
                },
            },
        },
    },
});
