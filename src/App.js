import React, { useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import GmailSummary from './components/GmailSummary';

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#7C4DFF',
        light: '#B388FF',
        dark: '#651FFF',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#00BFA5',
        light: '#64FFDA',
        dark: '#00897B',
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#F5F5F7' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1E1E1E',
      },
      text: {
        primary: mode === 'light' ? '#2C3E50' : '#E0E0E0',
        secondary: mode === 'light' ? '#546E7A' : '#B0BEC5',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
            padding: '8px 20px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          },
          containedPrimary: {
            background: 'linear-gradient(45deg, #7C4DFF 30%, #FF4081 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #651FFF 30%, #F50057 90%)',
            },
          },
        },
      },
    },
    gradient: {
      main: 'linear-gradient(45deg, #7C4DFF 30%, #FF4081 90%)',
    },
  });

function App() {
  const [mode] = useState('light');
  const theme = getTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GmailSummary />
    </ThemeProvider>
  );
}

export default App;
