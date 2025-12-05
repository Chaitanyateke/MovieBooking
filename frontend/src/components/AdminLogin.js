import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Button, TextField, Typography, Paper, Container, Alert } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // We use the same login API
      const res = await axios.post('http://moviebooking-backend-4ups.onrender.com/api/auth/login', { email, password });
      
      // BUT we check the role before letting them in
      if (res.data.user.role !== 'admin') {
        setError('Access Denied: You are not an administrator.');
        return;
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Redirect to Admin Dashboard
      navigate('/admin/dashboard');
      
    } catch (err) {
      setError('Invalid Admin Credentials');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: '#121212' // Dark background for Admin
    }}>
      <Container maxWidth="xs">
        <Paper sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          bgcolor: '#1e1e1e',
          color: 'white',
          border: '1px solid #333'
        }}>
          <SecurityIcon sx={{ fontSize: 50, color: '#d32f2f', mb: 2 }} />
          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
            ADMIN PORTAL
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal" required fullWidth label="Admin Email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              sx={{ 
                input: { color: 'white' }, 
                label: { color: 'gray' },
                '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#555' } }
              }}
            />
            <TextField
              margin="normal" required fullWidth label="Password" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              sx={{ 
                input: { color: 'white' }, 
                label: { color: 'gray' },
                '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#555' } }
              }}
            />
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

            <Button type="submit" fullWidth variant="contained" color="error" sx={{ mt: 3, mb: 2, py: 1.5 }}>
              Access Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminLogin;