import { CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { ReactNode } from 'react';


const theme = createTheme({
  palette: {
    mode: 'dark',

    background: {
      default: '#0b1020',
      paper: '#11162a'
    },

    primary: {
      main: '#4f8cff',
      contrastText: '#0b1020'
    },

    text: {
      primary: '#e6e9f0',
      secondary: '#a5acc5'
    },

    divider: 'rgba(255,255,255,0.08)'
  },

  typography: {
    fontFamily: 'IBM Plex Sans, system-ui, -apple-system, sans-serif',

    h1: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em'
    },
    h2: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 650,
      letterSpacing: '-0.02em'
    },
    h3: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 600
    },
    h4: {
      fontFamily: 'Space Grotesk, sans-serif',
      fontWeight: 600
    }
  },

  shape: {
    borderRadius: 12
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0b1020'
        }
      }
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0b1020',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'none'
        }
      }
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.08)'
        }
      }
    },

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10
        }
      }
    }
  }
});


interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
