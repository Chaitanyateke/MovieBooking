import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../api/auth';

// --- MUI Imports ---
import { Avatar, Button, TextField, Grid, Box, Typography, Alert, CircularProgress } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
// --- End MUI Imports ---

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', mobile: '' });
  const [otp, setOtp] = useState('');
  
  const [step, setStep] = useState(0); // 0: Form, 1: Verify OTP
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- VALIDATION REGEX ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[0-9]{10}$/; // Exactly 10 digits

  const handleChange = (e) => {
    const { name, value } = e.target;

    // --- MOBILE NUMBER RESTRICTION ---
    if (name === 'mobile') {
      // Only allow numbers (0-9) and max 10 digits
      // The regex /^\d*$/ checks if the string contains only digits or is empty
      if (/^\d*$/.test(value) && value.length <= 10) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      // For all other fields (name, email, password)
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validation
    if (!emailRegex.test(formData.email)) {
      setMessage('Please enter a valid email address.');
      return;
    }
    if (!mobileRegex.test(formData.mobile)) {
      setMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // 1. Call Register API -> Sends OTP
      await authService.register(formData.name, formData.email, formData.password, formData.mobile);
      setStep(1); // Move to OTP step
      setMessage('OTP sent to your email/mobile. Please check console for mock OTP.');
    } catch (error) {
      const resMessage = error.response?.data?.message || error.message;
      setMessage(resMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      // 2. Verify OTP -> Logs user in
      await authService.verifyOTP(formData.email, otp);
      navigate('/dashboard');
    } catch (error) {
      setMessage('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // --- DESIGN MATCHES LOGIN ---
        padding: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(100, 100, 100, 0.25)',
        backdropFilter: 'blur(3px)',
        maxWidth: '400px',
        width: '100%'
      }}
    >
      <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
        <LockOutlinedIcon />
      </Avatar>
      
      <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        {step === 0 ? 'Sign Up' : 'Verify OTP'}
      </Typography>

      {message && (
        <Alert severity={step === 1 && !message.includes('Invalid') ? "info" : "error"} sx={{ mb: 2, width: '100%' }}>
          {message}
        </Alert>
      )}

      {step === 0 ? (
        <Box component="form" onSubmit={handleRegisterSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Name"
            name="name"
            autoFocus
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          {/* --- UPDATED MOBILE FIELD --- */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="mobile"
            label="Mobile Number"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="10-digit number"
            inputProps={{ 
              maxLength: 10,     // HTML5 restriction
              inputMode: 'numeric', // Mobile numeric keyboard
              pattern: '[0-9]*'     // Numeric pattern
            }}
          />
          {/* --------------------------- */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
          </Button>
          
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2' }}>
                {"Already have an account? Sign in"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleVerifySubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter the 6-digit code sent to {formData.email}
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            id="otp"
            label="Enter OTP"
            name="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            autoFocus
            inputProps={{ maxLength: 6 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Login'}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => setStep(0)}
            sx={{ mt: 1 }}
          >
            Back
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Register;