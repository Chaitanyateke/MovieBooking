import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../api/admin';
import { 
  Box, AppBar, Toolbar, Typography, IconButton, Container, Grid, Paper, 
  Tabs, Tab, TextField, Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Avatar, MenuItem, Select, FormControl, InputLabel, 
  Alert, Chip, Divider, Dialog, DialogTitle, DialogContent, DialogActions, 
  List, ListItem, ListItemText, ListItemAvatar, InputAdornment, Badge, Menu
} from '@mui/material';

// Icons
import LogoutIcon from '@mui/icons-material/Logout';
import MovieIcon from '@mui/icons-material/Movie';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NotificationsIcon from '@mui/icons-material/Notifications';

// CSS to hide number input arrows
const numberInputStyle = {
  '& input[type=number]': { '-moz-appearance': 'textfield' },
  '& input[type=number]::-webkit-outer-spin-button': { '-webkit-appearance': 'none', margin: 0 },
  '& input[type=number]::-webkit-inner-spin-button': { '-webkit-appearance': 'none', margin: 0 }
};

// Custom red style for text fields
const redTextFieldStyle = {
  '& label.Mui-focused': {
    color: '#d32f2f',
  },
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused fieldset': {
      borderColor: '#d32f2f',
    },
  },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [tabValue, setTabValue] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Data States
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  
  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorElNotif, setAnchorElNotif] = useState(null);

  // Search States
  const [movieSearch, setMovieSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [showtimeSearch, setShowtimeSearch] = useState('');

  // User Details Dialog State
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);

  // Form States
  const [newMovie, setNewMovie] = useState({
    title: '',
    description: '',
    duration_mins: '',
    genre: '',
    image_url: ''
  });

  const [newShowtime, setNewShowtime] = useState({ 
    movie_id: '',
    date: '',
    time: '',
    screen_number: '',
    theater_name: '',
    location: '',
    price_classic: '',
    price_prime: '',
    price_recliner: '',
    price_premium: ''
  });

  useEffect(() => {
    refreshData();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Helper for min date
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper for min time
  const getCurrentTime = () => {
    const today = new Date();
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const refreshData = async () => {
    try {
      const [moviesRes, usersRes, showtimesRes, paymentsRes] = await Promise.all([
        adminService.getAllMovies(),
        adminService.getAllUsers(),
        adminService.getAllShowtimes(),
        adminService.getAllPayments()
      ]);
      setMovies(moviesRes.data || []);
      setUsers(usersRes.data || []);
      setShowtimes(showtimesRes.data || []);
      setPayments(paymentsRes.data.transactions || []);
      setTotalRevenue(paymentsRes.data.totalRevenue || 0);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  // -------- NOTIFICATIONS (LATEST + HISTORY) ----------
  const fetchNotifications = async () => {
    try {
      const res = await adminService.getNotifications();

      const list = (res.data.notifications || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setNotifications(list);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Notif error", err);
    }
  };

  const handleNotifClick = (event) => {
    setAnchorElNotif(event.currentTarget);
  };

  const handleNotifClose = async () => {
    setAnchorElNotif(null);
    if (unreadCount > 0) {
      try {
        await adminService.markNotificationsRead();
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch (err) {
        console.error("Mark read error", err);
      }
    }
  };
  // ---------------------------------------------------

  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handleMovieChange = (e) => setNewMovie({ ...newMovie, [e.target.name]: e.target.value });
  const handleShowtimeChange = (e) => setNewShowtime({ ...newShowtime, [e.target.name]: e.target.value });

  // --- FILTERING LOGIC ---
  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(movieSearch.toLowerCase()) || 
    (m.genre && m.genre.toLowerCase().includes(movieSearch.toLowerCase()))
  );

  const filteredUsers = users.filter(u => 
    u.user_name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.user_email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredShowtimes = showtimes.filter(st => 
    st.title.toLowerCase().includes(showtimeSearch.toLowerCase()) ||
    (st.theater_name && st.theater_name.toLowerCase().includes(showtimeSearch.toLowerCase())) ||
    (st.location && st.location.toLowerCase().includes(showtimeSearch.toLowerCase()))
  );

  const now = new Date();
  const activeShowtimes = filteredShowtimes.filter(st => new Date(st.start_time) >= now);
  const historyShowtimes = filteredShowtimes.filter(st => new Date(st.start_time) < now);

  // --- ACTIONS ---
  const handleAddMovie = async (e) => {
    e.preventDefault();
    try {
      await adminService.addMovie(newMovie);
      setMessage({ text: 'Movie Added!', type: 'success' });
      setNewMovie({ title: '', description: '', duration_mins: '', genre: '', image_url: '' });
      refreshData();
    } catch (err) {
      setMessage({ text: 'Failed to add movie.', type: 'error' });
    }
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm("Delete this movie?")) return;
    try {
      await adminService.deleteMovie(id);
      setMessage({ text: 'Movie Deleted.', type: 'success' });
      refreshData();
    } catch (err) {
      setMessage({ text: 'Failed to delete.', type: 'error' });
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await adminService.deleteUser(id);
      setMessage({ text: 'User Deleted.', type: 'success' });
      refreshData();
    } catch (err) {
      setMessage({ text: 'Failed to delete user.', type: 'error' });
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const res = await adminService.getUserDetails(userId);
      setSelectedUser(res.data.user);
      setUserBookings(res.data.bookings);
      setOpenUserDialog(true);
    } catch (err) {
      setMessage({ text: 'Failed to fetch user details.', type: 'error' });
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Delete this booking? This action cannot be undone.")) return;
    try {
      await adminService.deleteBooking(bookingId);
      setUserBookings(prev => prev.filter(b => b.booking_id !== bookingId));
      setMessage({ text: 'Booking deleted successfully.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to delete booking.', type: 'error' });
    }
  };

  const handleCloseDialog = () => {
    setOpenUserDialog(false);
    setSelectedUser(null);
    setUserBookings([]);
  };

  const handleAddShowtime = async (e) => {
    e.preventDefault();
    try {
      await adminService.addShowtime(newShowtime);
      setMessage({ text: 'Showtime Created!', type: 'success' });
      setNewShowtime({ 
        movie_id: '',
        date: '',
        time: '',
        screen_number: '',
        theater_name: '',
        location: '',
        price_classic: '',
        price_prime: '',
        price_recliner: '',
        price_premium: ''
      });
      refreshData();
    } catch (err) {
      setMessage({ text: 'Failed to create showtime.', type: 'error' });
    }
  };

  const handleDeleteShowtime = async (id) => {
    if (!window.confirm("Delete this showtime?")) return;
    try {
      await adminService.deleteShowtime(id);
      setMessage({ text: 'Showtime Deleted.', type: 'success' });
      refreshData();
    } catch (err) {
      setMessage({ text: 'Failed to delete showtime.', type: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f4f4' }}>
      <AppBar position="static" sx={{ bgcolor: '#212121' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: 'bold', color: '#d32f2f' }}
          >
            ADMIN CONSOLE
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit" onClick={handleNotifClick}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon sx={{ color: '#d32f2f' }} />
              </Badge>
            </IconButton>

            {/* NOTIFICATION MENU: LATEST (5) + HISTORY */}
            <Menu
              anchorEl={anchorElNotif}
              open={Boolean(anchorElNotif)}
              onClose={handleNotifClose}
              PaperProps={{ sx: { maxHeight: 500, width: 350 } }}
            >
              {notifications.length === 0 ? (
                <MenuItem disabled>No notifications</MenuItem>
              ) : (
                <Box sx={{ width: '100%' }}>
                  {/* LATEST SECTION */}
                  <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #eee' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Latest
                    </Typography>
                  </Box>

                  {notifications.slice(0, 5).map((notif) => (
                    <MenuItem
                      key={notif.notification_id}
                      onClick={handleNotifClose}
                      sx={{
                        whiteSpace: 'normal',
                        bgcolor: notif.is_read ? 'transparent' : '#fff3e0',
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={notif.is_read ? 'normal' : 'bold'}
                        >
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(notif.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}

                  {/* HISTORY SECTION */}
                  {notifications.length > 5 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ px: 2, py: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 'bold' }}
                        >
                          History
                        </Typography>
                      </Box>

                      <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                        {notifications.slice(5).map((notif) => (
                          <MenuItem
                            key={notif.notification_id}
                            onClick={handleNotifClose}
                            sx={{
                              whiteSpace: 'normal',
                              bgcolor: notif.is_read ? 'transparent' : '#fafafa',
                            }}
                          >
                            <Box>
                              <Typography variant="body2">
                                {notif.message}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                {new Date(notif.created_at).toLocaleString()}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              )}
            </Menu>

            <IconButton color="error" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* FULL WIDTH CONTAINER */}
      <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
        {message.text && (
          <Alert
            severity={message.type}
            sx={{ mb: 2 }}
            onClose={() => setMessage({ text: '', type: '' })}
          >
            {message.text}
          </Alert>
        )}

        <Paper sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: '#d32f2f' },
              '& .Mui-selected': { color: '#d32f2f' },
            }}
          >
            <Tab icon={<PlaylistAddIcon />} label="Add Movie" />
            <Tab icon={<MovieIcon />} label="Manage Movies" />
            <Tab icon={<AddCircleIcon />} label="Add Showtime" />
            <Tab icon={<AccessTimeIcon />} label="Manage Showtimes" />
            <Tab icon={<PeopleIcon />} label="Manage Users" />
            <Tab icon={<PaymentsIcon />} label="Payments" />
          </Tabs>
        </Paper>

        {/* TAB 0: ADD MOVIE (ONE FIELD PER ROW) */}
        {tabValue === 0 && (
          <Paper sx={{ p: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 'bold', mb: 3, color: '#d32f2f' }}
            >
              Add New Movie
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleAddMovie}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Movie Title *
                  </Typography>
                  <TextField
                    fullWidth
                    name="title"
                    value={newMovie.title}
                    onChange={handleMovieChange}
                    required
                    variant="outlined"
                    size="small"
                    sx={redTextFieldStyle}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Genre *
                  </Typography>
                  <TextField
                    fullWidth
                    name="genre"
                    value={newMovie.genre}
                    onChange={handleMovieChange}
                    required
                    variant="outlined"
                    size="small"
                    sx={redTextFieldStyle}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Duration (mins) *
                  </Typography>
                  <TextField
                    fullWidth
                    name="duration_mins"
                    type="number"
                    value={newMovie.duration_mins}
                    onChange={handleMovieChange}
                    required
                    variant="outlined"
                    size="small"
                    sx={{ ...numberInputStyle, ...redTextFieldStyle }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Poster URL *
                  </Typography>
                  <TextField
                    fullWidth
                    name="image_url"
                    value={newMovie.image_url}
                    onChange={handleMovieChange}
                    required
                    variant="outlined"
                    size="small"
                    sx={redTextFieldStyle}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Description *
                  </Typography>
                  <TextField
                    fullWidth
                    name="description"
                    multiline
                    rows={6}
                    value={newMovie.description}
                    onChange={handleMovieChange}
                    required
                    variant="outlined"
                    sx={redTextFieldStyle}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                color="error"
                size="large"
                fullWidth
                sx={{
                  mt: 4,
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                }}
                startIcon={<AddCircleIcon />}
              >
                Add Movie
              </Button>
            </form>
          </Paper>
        )}

        {/* TAB 1: MANAGE MOVIES */}
        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: '#d32f2f' }}
              >
                Manage Movies
              </Typography>
              <TextField
                placeholder="Search Title/Genre"
                size="small"
                value={movieSearch}
                onChange={(e) => setMovieSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={redTextFieldStyle}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Poster</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Genre</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMovies.map((m) => (
                    <TableRow key={m.movie_id} hover>
                      <TableCell>
                        <Avatar
                          variant="rounded"
                          src={m.image_url}
                          sx={{ width: 50, height: 75 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {m.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={m.genre} size="small" />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteMovie(m.movie_id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* TAB 2: ADD SHOWTIME (ONE FIELD PER ROW) */}
        {tabValue === 2 && (
          <Paper sx={{ p: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 'bold', mb: 3, color: '#d32f2f' }}
            >
              Add New Showtime
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleAddShowtime}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Select Movie *
                  </Typography>
                  <FormControl fullWidth size="small" sx={redTextFieldStyle}>
                    <InputLabel>Select Movie</InputLabel>
                    <Select
                      name="movie_id"
                      value={newShowtime.movie_id}
                      onChange={handleShowtimeChange}
                      required
                      label="Select Movie"
                    >
                      {movies.map((m) => (
                        <MenuItem key={m.movie_id} value={m.movie_id}>
                          {m.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Theater Name *
                  </Typography>
                  <TextField
                    fullWidth
                    name="theater_name"
                    value={newShowtime.theater_name}
                    onChange={handleShowtimeChange}
                    required
                    size="small"
                    sx={redTextFieldStyle}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Location *
                  </Typography>
                  <TextField
                    fullWidth
                    name="location"
                    value={newShowtime.location}
                    onChange={handleShowtimeChange}
                    required
                    size="small"
                    sx={redTextFieldStyle}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Screen Number *
                  </Typography>
                  <TextField
                    fullWidth
                    name="screen_number"
                    type="number"
                    inputProps={{ min: 1 }}
                    value={newShowtime.screen_number}
                    onChange={handleShowtimeChange}
                    required
                    size="small"
                    sx={{ ...numberInputStyle, ...redTextFieldStyle }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Date *
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    name="date"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: getTodayDate() }}
                    value={newShowtime.date}
                    onChange={handleShowtimeChange}
                    required
                    size="small"
                    sx={redTextFieldStyle}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Time *
                  </Typography>
                  <TextField
                    fullWidth
                    type="time"
                    name="time"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min:
                        newShowtime.date === getTodayDate()
                          ? getCurrentTime()
                          : null,
                    }}
                    value={newShowtime.time}
                    onChange={handleShowtimeChange}
                    required
                    size="small"
                    sx={redTextFieldStyle}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    sx={{
                      mt: 2,
                      fontWeight: 'bold',
                      borderBottom: '1px solid #eee',
                      pb: 1,
                    }}
                  >
                    Set Ticket Prices (₹)
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Classic Price
                  </Typography>
                  <TextField
                    fullWidth
                    name="price_classic"
                    type="number"
                    value={newShowtime.price_classic}
                    onChange={handleShowtimeChange}
                    placeholder="200"
                    size="small"
                    sx={{ ...numberInputStyle, ...redTextFieldStyle }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Prime Price
                  </Typography>
                  <TextField
                    fullWidth
                    name="price_prime"
                    type="number"
                    value={newShowtime.price_prime}
                    onChange={handleShowtimeChange}
                    placeholder="350"
                    size="small"
                    sx={{ ...numberInputStyle, ...redTextFieldStyle }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recliner Price
                  </Typography>
                  <TextField
                    fullWidth
                    name="price_recliner"
                    type="number"
                    value={newShowtime.price_recliner}
                    onChange={handleShowtimeChange}
                    placeholder="550"
                    size="small"
                    sx={{ ...numberInputStyle, ...redTextFieldStyle }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Premium Price
                  </Typography>
                  <TextField
                    fullWidth
                    name="price_premium"
                    type="number"
                    value={newShowtime.price_premium}
                    onChange={handleShowtimeChange}
                    placeholder="870"
                    size="small"
                    sx={{ ...numberInputStyle, ...redTextFieldStyle }}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                color="error"
                size="large"
                fullWidth
                sx={{
                  mt: 4,
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                }}
                startIcon={<AddCircleIcon />}
              >
                Create Showtime
              </Button>
            </form>
          </Paper>
        )}

        {/* TAB 3: MANAGE SHOWTIMES */}
        {tabValue === 3 && (
          <Box>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', color: '#d32f2f' }}
                >
                  Active Showtimes
                </Typography>
                <TextField
                  placeholder="Search..."
                  size="small"
                  value={showtimeSearch}
                  onChange={(e) => setShowtimeSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={redTextFieldStyle}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Movie</TableCell>
                      <TableCell>Date &amp; Time</TableCell>
                      <TableCell>Theater</TableCell>
                      <TableCell>Prices (C/P/R/PR)</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeShowtimes.length > 0 ? (
                      activeShowtimes.map((st) => (
                        <TableRow key={st.showtime_id} hover>
                          <TableCell>
                            <b>{st.title}</b>
                          </TableCell>
                          <TableCell>
                            {new Date(st.start_time).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                            })}
                          </TableCell>
                          <TableCell>
                            {st.theater_name}, {st.location} (Screen{' '}
                            {st.screen_number})
                          </TableCell>
                          <TableCell>
                            ₹{st.price_classic || 200} / {st.price_prime || 350}{' '}
                            / {st.price_recliner || 550} /{' '}
                            {st.price_premium || 870}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              color="error"
                              onClick={() =>
                                handleDeleteShowtime(st.showtime_id)
                              }
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No active showtimes.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper sx={{ p: 3, bgcolor: '#ffffff' }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', color: '#000000' }}
              >
                Showtime History
              </Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Movie</TableCell>
                      <TableCell>Date &amp; Time</TableCell>
                      <TableCell>Theater</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyShowtimes.map((st) => (
                      <TableRow key={st.showtime_id}>
                        <TableCell sx={{ color: '#000' }}>
                          {st.title}
                        </TableCell>
                        <TableCell sx={{ color: '#000' }}>
                          {new Date(st.start_time).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                          })}
                        </TableCell>
                        <TableCell sx={{ color: '#000' }}>
                          {st.theater_name}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() =>
                              handleDeleteShowtime(st.showtime_id)
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* TAB 4: MANAGE USERS */}
        {tabValue === 4 && (
          <Paper sx={{ p: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: '#d32f2f' }}
              >
                Registered Users
              </Typography>
              <TextField
                placeholder="Search..."
                size="small"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={redTextFieldStyle}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Avatar</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow
                      key={u.user_id}
                      hover
                      onClick={() => handleViewUser(u.user_id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Avatar src={u.avatar_url}>
                          {u.user_name ? u.user_name[0] : 'U'}
                        </Avatar>
                      </TableCell>
                      <TableCell>{u.user_name}</TableCell>
                      <TableCell>{u.user_email}</TableCell>
                      <TableCell>{u.mobile_number || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role}
                          sx={{
                            bgcolor:
                              u.role === 'admin' ? '#d32f2f' : '#e0e0e0',
                            color: u.role === 'admin' ? 'white' : 'black',
                            fontWeight: 'bold',
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {u.user_email !== user?.user_email ? (
                          <>
                            <IconButton
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewUser(u.user_id);
                              }}
                              title="View Details"
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(u.user_id);
                              }}
                              title="Delete User"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        ) : (
                          <Typography variant="caption">
                            Current Admin
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* TAB 5: PAYMENTS */}
        {tabValue === 5 && (
          <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: '#2e7d32',
                    color: 'white',
                  }}
                >
                  <AccountBalanceWalletIcon sx={{ fontSize: 50, mr: 2 }} />
                  <Box>
                    <Typography variant="subtitle1">
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      ₹{totalRevenue.toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: '#1976d2',
                    color: 'white',
                  }}
                >
                  <PaymentsIcon sx={{ fontSize: 50, mr: 2 }} />
                  <Box>
                    <Typography variant="subtitle1">
                      Total Transactions
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {payments.length}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            <Paper sx={{ p: 3 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 'bold', color: '#d32f2f' }}
              >
                Transaction History
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Date &amp; Time
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        User Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        User Email
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Cardholder
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Card Number
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Amount
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Transaction ID
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.transaction_id} hover>
                        <TableCell>
                          {new Date(p.booking_time).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                          })}
                        </TableCell>
                        <TableCell>{p.user_name}</TableCell>
                        <TableCell>{p.user_email}</TableCell>
                        <TableCell>{p.card_holder || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={p.card_number_mask || 'N/A'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 'bold',
                            color: '#2e7d32',
                          }}
                        >
                          ₹{p.total_amount}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                          }}
                        >
                          {p.transaction_id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* USER DETAILS DIALOG */}
        <Dialog
          open={openUserDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              bgcolor: '#1E1E1E',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            User Details
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedUser && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={selectedUser.avatar_url}
                    sx={{
                      width: 120,
                      height: 120,
                      margin: '0 auto',
                      bgcolor: 'primary.main',
                      fontSize: '3rem',
                    }}
                  >
                    {selectedUser.user_name
                      ? selectedUser.user_name[0].toUpperCase()
                      : 'U'}
                  </Avatar>
                  <Typography
                    variant="h5"
                    sx={{ mt: 2, fontWeight: 'bold' }}
                  >
                    {selectedUser.user_name}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 1,
                      color: 'text.secondary',
                    }}
                  >
                    <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedUser.user_email}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.5,
                      color: 'text.secondary',
                    }}
                  >
                    <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedUser.mobile_number || 'N/A'}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedUser.role}
                    sx={{ mt: 2 }}
                    color={selectedUser.role === 'admin' ? 'error' : 'warning'}
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ borderBottom: '2px solid #ddd', pb: 1 }}
                  >
                    Booking History
                  </Typography>
                  {userBookings.length > 0 ? (
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {userBookings.map((booking) => (
                        <React.Fragment key={booking.booking_id}>
                          <ListItem
                            alignItems="flex-start"
                            secondaryAction={
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                color="error"
                                onClick={() =>
                                  handleDeleteBooking(booking.booking_id)
                                }
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemAvatar>
                              <Avatar
                                src={booking.image_url}
                                variant="rounded"
                              >
                                <EventIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                  pr={2}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                  >
                                    {booking.title}
                                  </Typography>
                                  <Chip
                                    label={`₹${
                                      booking.total_amount || '0'
                                    } • ${booking.total_tickets} tix`}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    display="block"
                                  >
                                    Showtime:{' '}
                                    {new Date(
                                      booking.start_time
                                    ).toLocaleString('en-IN', {
                                      timeZone: 'Asia/Kolkata',
                                    })}
                                  </Typography>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    display="block"
                                  >
                                    Booked On:{' '}
                                    {new Date(
                                      booking.booking_time
                                    ).toLocaleString('en-IN', {
                                      timeZone: 'Asia/Kolkata',
                                    })}
                                  </Typography>
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    display="block"
                                    color="textSecondary"
                                  >
                                    {booking.cinema_name} (Screen{' '}
                                    {booking.screen_number})
                                  </Typography>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="primary"
                                    fontWeight="bold"
                                    sx={{ mt: 0.5, display: 'block' }}
                                  >
                                    <ConfirmationNumberIcon
                                      fontSize="small"
                                      sx={{
                                        verticalAlign: 'middle',
                                        mr: 0.5,
                                      }}
                                    />
                                    Seats: {booking.seat_numbers}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography>No bookings found for this user.</Typography>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
