import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../api/auth';

import {
  Avatar,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Alert,
  Paper,
  Divider,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import MovieLogo from '../assets/Logo.png';

const Profile = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

  const [tab, setTab] = useState(0);

  // profile fields
  const [name, setName] = useState(storedUser?.user_name || '');
  const [email, setEmail] = useState(storedUser?.user_email || '');
  const [avatarUrl, setAvatarUrl] = useState(storedUser?.avatar_url || '');

  // password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // keep profile fields in sync on first mount
  useEffect(() => {
    if (storedUser) {
      setName(storedUser.user_name || '');
      setEmail(storedUser.user_email || '');
      setAvatarUrl(storedUser.avatar_url || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (_e, value) => {
    setTab(value);
    setMessage({ type: '', text: '' });
  };

  const showMessage = (type, text) => setMessage({ type, text });

  // ---------- avatar: upload from device ----------

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        // store base64 image data
        setAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ---------- update profile ----------

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!name.trim()) {
      showMessage('error', 'Name is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.updateProfile({
        name: name.trim(),
        avatar_url: avatarUrl || null,
      });

      const updatedUser = {
        ...storedUser,
        user_name: res.data?.user_name || res.user_name || name.trim(),
        avatar_url: res.data?.avatar_url || res.avatar_url || avatarUrl || null,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      showMessage('success', 'Profile updated successfully.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      showMessage('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ---------- change password ----------

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!oldPassword || !newPassword || !confirmPassword) {
      showMessage('error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      showMessage('success', 'Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      showMessage('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => navigate('/');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'linear-gradient(180deg,#FFFDE7,#FFF9C4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          maxWidth: 800,
          width: '100%',
          p: 3,
          borderRadius: 3,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(6px)',
        }}
      >
        {/* Header with back + logo + title */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={goBack}
              sx={{
                mr: 1,
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateX(-2px)' },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              My Profile
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="img"
              src={MovieLogo}
              alt="Movie Ticket Booking"
              sx={{ height: 36, width: 'auto' }}
            />
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 'bold',
                letterSpacing: 0.5,
                color: '#FFB300',
              }}
            >
              MOVIE TICKET BOOKING
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* User info card header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Avatar
            src={avatarUrl || undefined}
            sx={{
              width: 80,
              height: 80,
              mr: 2.5,
              bgcolor: 'primary.main',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {name ? name[0].toUpperCase() : <LockOutlinedIcon />}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {name || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {email}
            </Typography>
          </Box>
        </Box>

        <Tabs
          value={tab}
          onChange={handleTabChange}
          sx={{
            mb: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'bold',
            },
          }}
        >
          <Tab label="Profile" />
          <Tab label="Change Password" />
        </Tabs>

        {message.text && (
          <Alert
            severity={message.type}
            sx={{ mb: 2 }}
            onClose={() => setMessage({ type: '', text: '' })}
          >
            {message.text}
          </Alert>
        )}

        {tab === 0 && (
          <Box component="form" onSubmit={handleProfileSubmit} noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Name"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  fullWidth
                  value={email}
                  disabled
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Avatar Image URL"
                  fullWidth
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  helperText="Paste an image URL to use it as your avatar."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{
                    height: '100%',
                    mt: { xs: 2, md: 0 },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'translateY(-1px)' },
                  }}
                >
                  Upload avatar from device
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                  />
                </Button>
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                py: 1.2,
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-1px) scale(1.01)' },
              }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        )}

        {tab === 1 && (
          <Box component="form" onSubmit={handlePasswordSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Current Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                py: 1.2,
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-1px) scale(1.01)' },
              }}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Profile;
