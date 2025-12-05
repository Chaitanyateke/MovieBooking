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

  // keep profile fields in sync if localStorage user changes
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

      // update localStorage
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
        bgcolor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 700,
          width: '100%',
          p: 3,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={goBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            My Profile
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={avatarUrl}
            sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}
          >
            {name ? name[0].toUpperCase() : <LockOutlinedIcon />}
          </Avatar>
          <Box>
            <Typography variant="h6">{name || 'User'}</Typography>
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
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 'bold' },
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
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  fullWidth
                  value={email}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Avatar Image URL"
                  fullWidth
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
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
              sx={{ mt: 3 }}
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
