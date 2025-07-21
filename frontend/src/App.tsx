import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ShiftBoardFuyouApp } from './components/ShiftBoardFuyouApp';

// Material-UI theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ShiftBoardFuyouApp />
    </ThemeProvider>
  );
}

export default App;
