import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../api/auth';

// --- MUI Imports ---
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; 
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs'; 
import Tab from '@mui/material/Tab'; 
import CircularProgress from '@mui/material/CircularProgress';
// --- End MUI Imports ---

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // User: Email/Mobile, Admin: Email
  const [password, setPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [loginType, setLoginType] = useState(0); // 0 = User, 1 = Admin
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[0-9]{10}$/;

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    try {
      // --- VALIDATION ---
      const isEmail = emailRegex.test(identifier);
      const isMobile = mobileRegex.test(identifier);
      
      if (loginType === 1) {
        // Admin Validation: Email Only
        if (!isEmail) {
           setMessage('Admin login requires a valid Email Address.');
           setLoading(false);
           return;
        }
      } else {
        // User Validation: Email or Mobile
        if (!isEmail && !isMobile) {
           setMessage('Please enter a valid Email or 10-digit Mobile Number.');
           setLoading(false);
           return;
        }
      }

      // --- API CALL ---
      const response = await authService.login(identifier, password);
      const userRole = response.user.role;

      // --- ROLE ENFORCEMENT ---
      if (loginType === 1) { 
        // ADMIN MODE
        if (userRole !== 'admin') {
          setMessage('Access Denied: You are not an Administrator.');
          authService.logout(); 
          setLoading(false);
          return;
        }
        navigate('/admin/dashboard');
      } else { 
        // USER MODE
        if (userRole === 'admin') {
          setMessage('Admins must use the Admin Login tab.');
          authService.logout();
          setLoading(false);
          return;
        }
        navigate('/dashboard');
      }

    } catch (error) {
      setLoading(false);
      const resMessage = error.response?.data?.message || 'Login failed';
      setMessage(resMessage);
    }
  };

  const handleTabChange = (e, val) => {
      setLoginType(val);
      setMessage('');
      setIdentifier('');
      setPassword('');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // Glass effect
        padding: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(100, 100, 100, 0.25)',
        backdropFilter: 'blur(3px)',
        maxWidth: '400px',
        width: '100%'
      }}
    >
      <Avatar sx={{ m: 1, bgcolor: loginType === 1 ? '#d32f2f' : 'secondary.main' }}>
        {loginType === 0 ? <LockOutlinedIcon /> : <AdminPanelSettingsIcon />}
      </Avatar>
      
      <Typography 
        component="h1" 
        variant="h5" 
        sx={{ 
          color: loginType === 1 ? '#d32f2f' : 'inherit',
          fontWeight: 'bold',
          mb: 2
        }}
      >
        {loginType === 0 ? 'User Sign In' : 'Admin Portal'}
      </Typography>

      <Tabs 
        value={loginType} 
        onChange={handleTabChange} 
        textColor={loginType === 1 ? 'inherit' : 'primary'}
        indicatorColor={loginType === 1 ? 'secondary' : 'primary'}
        variant="fullWidth"
        sx={{ 
          width: '100%', 
          mb: 2,
          '& .MuiTabs-indicator': {
             backgroundColor: loginType === 1 ? '#d32f2f' : undefined
          }
        }}
      >
        <Tab label="User" />
        <Tab label="Admin" sx={{ color: loginType === 1 ? '#d32f2f' : undefined }} />
      </Tabs>

      {message && (
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
          {message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
        <TextField
          margin="normal" required fullWidth
          label={loginType === 1 ? "Admin Email" : "Email or Mobile Number"}
          autoFocus
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <TextField
          margin="normal" required fullWidth
          name="password" label="Password" type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="submit" fullWidth variant="contained"
          disabled={loading}
          sx={{ 
            mt: 3, mb: 2,
            bgcolor: loginType === 1 ? '#d32f2f' : 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: loginType === 1 ? '#b71c1c' : undefined
            }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : (loginType === 0 ? 'Sign In' : 'Access Dashboard')}
        </Button>
        
        {loginType === 0 && (
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link to="/register" style={{ textDecoration: 'none', color: '#1976d2' }}>
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default Login;