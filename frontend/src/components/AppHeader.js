// src/components/AppHeader.js
import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import LogoutIcon from '@mui/icons-material/Logout';

import logo from '../assets/logo/movie-logo.png'; // <-- keep same path you used in Dashboard

const AppHeader = ({
  isLoggedIn,
  user,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  onBookingsClick,
}) => {
  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <Toolbar
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          width: '100%',
        }}
      >
        {/* LEFT: Logo + Brand text (always the same) */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box
            component="img"
            src={logo}
            alt="Movie Ticket Booking Logo"
            sx={{
              height: 34,
              width: 'auto',
              mr: 1.5,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              letterSpacing: 1,
              color: '#FFB300',
              textTransform: 'uppercase',
            }}
          >
            Movie Ticket Booking
          </Typography>
        </Box>

        {/* RIGHT: Auth area */}
        {isLoggedIn ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: 'text.secondary' }}>
              Welcome, {user?.user_name || 'User'}!
            </Typography>

            {onBookingsClick && (
              <Button
                color="inherit"
                onClick={onBookingsClick}
                sx={{
                  mr: 1,
                  color: 'text.primary',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-1px)' },
                }}
              >
                My Bookings
              </Button>
            )}

            {onProfileClick && (
              <IconButton
                onClick={onProfileClick}
                size="small"
                title="Profile"
                sx={{ mr: 1 }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.main',
                  }}
                  src={user?.avatar_url || ''}
                >
                  {user?.user_name ? user.user_name[0].toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
            )}

            {onLogoutClick && (
              <IconButton
                color="primary"
                onClick={onLogoutClick}
                title="Logout"
              >
                <LogoutIcon />
              </IconButton>
            )}
          </Box>
        ) : (
          onLoginClick && (
            <Button
              variant="contained"
              color="warning"
              onClick={onLoginClick}
              sx={{
                py: 0.8,
                px: 3,
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 20,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-1px) scale(1.01)',
                },
              }}
            >
              Login
            </Button>
          )
        )}
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
