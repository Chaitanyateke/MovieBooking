import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../api/auth';

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

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[0-9]{10}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mobile') {
      if (/^\d*$/.test(value) && value.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!emailRegex.test(formData.email)) {
      setMessageType('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    if (!mobileRegex.test(formData.mobile)) {
      setMessageType('error');
      setMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (formData.password.length < 6) {
      setMessageType('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // Register + login in one step (backend returns token + user)
      await authService.register(
        formData.name,
        formData.email,
        formData.password,
        formData.mobile
      );

      setMessageType('success');
      setMessage('Registration successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (error) {
      const resMessage = error.response?.data?.message || error.message;
      setMessageType('error');
      setMessage(resMessage);
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
        maxWidth: 400,
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

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
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
            <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2' }}>
              Already have an account? Sign in
            </Link>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Register;
