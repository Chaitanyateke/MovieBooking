import React from 'react'; 
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

// MUI Imports
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

// Page Components
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard'; // Public landing + logged-in dashboard
import Profile from './components/Profile'; 
import MyBookings from './components/MyBookings'; 
import ProtectedRoute from './components/ProtectedRoute';
import MovieBackground from './components/MovieBackground'; 
import AdminDashboard from './components/AdminDashboard'; 

// Your theme configuration
const darkTheme = createTheme({
  palette: {
    mode: 'light', 
    primary: { main: '#FFC107' },
    secondary: { main: '#00BCD4' },
    error: { main: '#d32f2f' },
    background: { default: '#FEFFC4', paper: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#424242' },
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'sans-serif'].join(','),
    h5: { fontWeight: 600, color: '#000000' },
    h2: { fontWeight: 700, color: '#000000' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(to bottom right, #FEFFC4, #FFFFFF)',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 'bold' },
        containedPrimary: { color: '#121212' }, 
        containedError: { color: '#FFFFFF' }, 
        outlinedPrimary: { borderWidth: '2px', '&:hover': { borderWidth: '2px' } },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255,255,255,0.5)',
            '& fieldset': { borderColor: '#bdbdbd' },
            '&:hover fieldset': { borderColor: '#000' },
            '&.Mui-focused fieldset': { borderColor: '#FFC107' },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundColor: '#FFFFFF' } },
    },
  },
});

// Layout component
const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isDashboard =
    location.pathname.includes('dashboard') || location.pathname.includes('my-bookings');
  
  const getContainerWidth = () => {
    if (isDashboard) return false; // Full width
    if (isAuthPage) return 'sm'; 
    return 'lg'; 
  };

  return (
    <>
      {/* Background grid only visible on Login/Register pages */}
      {isAuthPage && <MovieBackground />}

      <Container 
        component="main" 
        maxWidth={getContainerWidth()} 
        disableGutters={isDashboard} 
      >
        <Box
          sx={{
            marginTop: isDashboard ? 0 : 8, 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isAuthPage ? 'center' : 'stretch', 
            justifyContent: isAuthPage ? 'center' : 'flex-start',
          }}
        >
          <Routes>
            {/* PUBLIC LANDING PAGE – shows Now Playing movies */}
            <Route path="/" element={<Dashboard />} /> 
            
            {/* AUTH PAGES */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* PROTECTED DASHBOARD – requires login */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* PROTECTED ROUTES */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/login" element={<Login />} /> 
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* OPTIONAL: fallback */}
            {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
          </Routes>
        </Box>
      </Container>
    </>
  );
};

// Main App component
function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <AppLayout />
      </Router>
    </ThemeProvider>
  );
}

export default App;
