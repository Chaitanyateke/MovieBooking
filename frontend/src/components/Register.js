import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../api/auth';

// --- MUI Imports ---
import {
  Avatar,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
// --- End MUI Imports ---

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error'); // "error" | "success"
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // --- VALIDATION REGEX ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[0-9]{10}$/; // Exactly 10 digits

  const handleChange = (e) => {
    const { name, value } = e.target;

    // MOBILE NUMBER: only digits, max 10
    if (name === 'mobile') {
      if (/^\d*$/.test(value) && value.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Basic validation
    if (!formData.name.trim()) {
      setMessage('Please enter your name.');
      setMessageType('error');
      return;
    }

    if (!emailRegex.test(formData.email)) {
      setMessage('Please enter a valid email address.');
      setMessageType('error');
      return;
    }

    if (!mobileRegex.test(formData.mobile)) {
      setMessage('Please enter a valid 10-digit mobile number.');
      setMessageType('error');
      return;
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      // Backend now returns { message, token, user } and
      // authService.register stores token + user in localStorage.
      await authService.register(
        formData.name,
        formData.email,
        formData.password,
        formData.mobile
      );

      setMessage('Registration successful! Redirecting...');
      setMessageType('success');

      // Small delay so user sees the success message
      setTimeout(() => {
        navigate('/dashboard'); // or '/' if you prefer
      }, 800);
    } catch (error) {
      const resMessage = error.response?.data?.message || error.message;
      setMessage(resMessage);
      setMessageType('error');
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
        padding: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(100, 100, 100, 0.25)',
        backdropFilter: 'blur(3px)',
        maxWidth: '400px',
        width: '100%',
      }}
    >
      <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
        <LockOutlinedIcon />
      </Avatar>

      <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        Sign Up
      </Typography>

      {message && (
        <Alert severity={messageType} sx={{ mb: 2, width: '100%' }}>
          {message}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleRegisterSubmit}
        noValidate
        sx={{ mt: 1, width: '100%' }}
      >
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
            maxLength: 10,
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
        />

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
            <Link
              to="/login"
              style={{ textDecoration: 'none', color: '#1976d2' }}
            >
              {'Already have an account? Sign in'}
            </Link>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Register;
