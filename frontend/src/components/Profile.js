import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Container, Paper, IconButton, Button, TextField, Alert, Collapse, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import authService from '../api/auth';
import { supabase } from '../supabaseClient'; 

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

const Profile = () => {
  const navigate = useNavigate();
  // Get user details from localStorage initially
  const initialUser = JSON.parse(localStorage.getItem('user'));

  // State to hold the current user data (used for displaying profile)
  const [userProfile, setUserProfile] = useState(initialUser); 
  
  // State for form data (used only when editing)
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: initialUser?.user_name || '',
    avatar_url: initialUser?.avatar_url || '',
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  // --- NEW STATE FOR CACHE BUSTING ---
  const [avatarKey, setAvatarKey] = useState(Date.now());

  const handleGoBack = () => {
    if (userProfile?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing); 
    setError('');
    setSuccess('');
    // Reset form data to current user state if canceling edit
    setFormData({
        name: userProfile?.user_name || '',
        avatar_url: userProfile?.avatar_url || '',
    });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  // --- IMAGE UPLOAD LOGIC (CACHING FIX APPLIED) ---
  const handleImageUpload = async (event) => {
    setError('');
    setSuccess('');
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${initialUser.user_id}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploading(true);

    try {
      // 1. Upload the file
      await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // 2. Update formData with the new public URL (for saving)
      setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      // 3. Update the cache key (for immediate preview)
      setAvatarKey(Date.now()); 
      
      setSuccess('Image uploaded! Click SAVE to confirm changes.');

    } catch (err) {
      setError('Failed to upload image. Check Supabase RLS.');
    } finally {
      setUploading(false);
    }
  };

  // --- SAVE PROFILE (Name & Avatar URL) ---
  const handleSave = async () => {
    setError('');
    setSuccess('');
    try {
      const dataToUpdate = {
        name: formData.name,
        avatar_url: formData.avatar_url,
      };
      
      const updatedUser = await authService.updateProfile(dataToUpdate);
      
      // 1. Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser.data));
      // 2. Update local state to force render
      setUserProfile(updatedUser.data); 
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
    } catch (err) { setError('Failed to update profile.'); }
  };

  // --- SAVE NEW PASSWORD ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(''); setPasswordSuccess('');
    try {
      await authService.changePassword(passwordData.oldPassword, passwordData.newPassword);
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '' });
      setShowPasswordForm(false);
    } catch (err) { setPasswordError(err.response?.data?.message || 'Failed to change password.'); }
  };


  return (
    <Container maxWidth="sm">
      <Paper sx={{ mt: 4, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.paper', position: 'relative' }}>
        
        {/* Header Icons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: 16, left: 16, right: 16 }}>
          <IconButton color="primary" onClick={handleGoBack} title="Back to Dashboard"><ArrowBackIcon /></IconButton>
          
          {isEditing ? (
            <IconButton color="primary" onClick={handleSave} title="Save Changes"><SaveIcon /></IconButton>
          ) : (
            <IconButton color="primary" onClick={handleEditToggle} title="Edit Profile"><EditIcon /></IconButton>
          )}
        </Box>
        
        <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Avatar Rendering Logic: Uses unique key to force refresh */}
          <Avatar 
            key={avatarKey} // Force refresh when image changes
            sx={{ width: 120, height: 120, mb: 2, bgcolor: 'primary.main', fontSize: '4rem' }}
            // Append cache-buster to the URL
            src={`${isEditing ? formData.avatar_url : userProfile?.avatar_url}?cb=${avatarKey}`}
          >
            {userProfile?.user_name ? userProfile.user_name[0].toUpperCase() : 'U'}
          </Avatar>

          {error && <Alert severity="error" sx={{ my: 2, width: '100%' }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ my: 2, width: '100%' }}>{success}</Alert>}

          {isEditing ? (
            // --- EDIT MODE ---
            <Box component="form" sx={{ width: '100%' }}>
              <TextField margin="normal" required fullWidth id="name" label="User Name" name="name" value={formData.name} onChange={handleChange} />
              
              <Button 
                variant="contained" component="label" startIcon={<PhotoCamera />} 
                sx={{ mt: 2 }} disabled={uploading}>
                {uploading ? <CircularProgress size={24} color="inherit" /> : 'Upload Profile Image'}
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} /> 
              </Button>
            </Box>
          ) : (
            // --- VIEW MODE ---
            <>
              <Typography component="h1" variant="h4" gutterBottom>
                {userProfile?.user_name}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                <EmailIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'text-top' }} />
                {userProfile?.user_email}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 2 }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body1">{userProfile?.mobile_number || 'N/A'}</Typography>
              </Box>

              <Button variant="outlined" onClick={() => setShowPasswordForm(!showPasswordForm)} sx={{ mt: 2 }}>
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </Button>
            </>
          )}
          
          <Collapse in={showPasswordForm} sx={{ width: '100%' }}>
            <Box component="form" onSubmit={handlePasswordSubmit} sx={{ mt: 3, border: '1px solid', borderColor: 'divider', p: 3, borderRadius: 2 }}>
              <Typography component="h3" variant="h6" gutterBottom>Change Your Password</Typography>
              <TextField margin="normal" required fullWidth name="oldPassword" label="Old Password" type="password" value={passwordData.oldPassword} onChange={handlePasswordChange} />
              <TextField margin="normal" required fullWidth name="newPassword" label="New Password" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} />
              {passwordError && <Alert severity="error" sx={{ mt: 2 }}>{passwordError}</Alert>}
              {passwordSuccess && <Alert severity="success" sx={{ mt: 2 }}>{passwordSuccess}</Alert>}
              <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Save New Password</Button>
            </Box>
          </Collapse>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;