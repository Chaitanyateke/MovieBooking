import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../api/auth';
import eventService from '../api/events';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';

// ---------- helpers ----------

const seatStyle = (status, isSelected) => {
  const isBooked = status === 'booked';
  const isAvailable = status === 'available';

  let bgcolor = '#fff';
  let color = '#4caf50';
  let border = '1px solid #4caf50';

  if (isBooked) {
    bgcolor = '#d32f2f';
    color = '#fff';
    border = '1px solid #d32f2f';
  } else if (isSelected) {
    bgcolor = '#4caf50';
    color = '#fff';
    border = '1px solid #4caf50';
  }

  return {
    width: '30px',
    height: '30px',
    margin: '3px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    cursor: isAvailable ? 'pointer' : 'not-allowed',
    backgroundColor: bgcolor,
    color,
    border,
    fontWeight: 'bold',
    transition: 'all 0.2s',
  };
};

const groupSeatsByRow = (seats) => {
  const rows = {};
  seats.forEach((seat) => {
    if (!rows[seat.seat_row]) rows[seat.seat_row] = [];
    rows[seat.seat_row].push(seat);
  });
  Object.keys(rows).forEach((row) => {
    rows[row].sort((a, b) => a.seat_number - b.seat_number);
  });
  return rows;
};

const formatCardNumber = (v) =>
  v.replace(/\s+/g, '').replace(/[^0-9]/gi, '').match(/\d{1,4}/g)?.join(' ') || '';

const formatExpiry = (v) =>
  v
    .replace(/\s+/g, '')
    .replace(/[^0-9]/gi, '')
    .match(/\d{1,2}/g)
    ?.join('/')
    .substring(0, 5) || '';

const isExpiryValid = (expiry) => {
  if (!expiry || expiry.length !== 5 || expiry.indexOf('/') !== 2) return false;
  const [mmStr, yyStr] = expiry.split('/');
  const month = parseInt(mmStr, 10);
  const year = parseInt(yyStr, 10);

  if (Number.isNaN(month) || Number.isNaN(year)) return false;
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear() % 100;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
};

// ---------- component ----------

const Dashboard = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const user = isLoggedIn ? JSON.parse(localStorage.getItem('user')) : null;

  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [seats, setSeats] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');

  const [openPayment, setOpenPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: '',
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  // pagination state
  const [page, setPage] = useState(1);
  const moviesPerPage = 8;

  // ---------- fetch movies (public endpoint) ----------

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setError('');
        let response;
        if (eventService.getPublicMovies) {
          response = await eventService.getPublicMovies();
        } else {
          response = await eventService.getMovies();
        }
        const data = response.data || [];
        const sorted = [...data].sort((a, b) => b.movie_id - a.movie_id);
        setMovies(sorted);
      } catch (err) {
        console.error(err);
        setError('Could not fetch movies.');
      }
    };

    fetchMovies();
  }, []);

  // reset page when search / filter / movie list changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, genreFilter, movies.length]);

  const handleProfileClick = () => navigate('/profile');

  const fetchShowtimes = async (movie) => {
    try {
      setSelectedMovie(movie);
      setSelectedShowtime(null);
      setSeats([]);
      setError('');

      const response = await eventService.getShowtimes(movie.movie_id);
      const data = (response.data || []).map((showtime) => ({
        price_classic: 200,
        price_prime: 350,
        price_recliner: 550,
        price_premium: 870,
        ...showtime,
      }));

      setShowtimes(data);
    } catch (err) {
      console.error(err);
      setError('Could not fetch showtimes.');
    }
  };

  const fetchSeats = async (showtime) => {
    try {
      setSelectedShowtime(showtime);
      setSelectedSeats([]);
      setError('');
      const response = await eventService.getSeatsForShowtime(showtime.showtime_id);
      setSeats(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Could not fetch seats.');
    }
  };

  const handleSeatClick = (seat) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (seat.status !== 'available') return;

    setSelectedSeats((prev) =>
      prev.includes(seat.seat_id)
        ? prev.filter((id) => id !== seat.seat_id)
        : [...prev, seat.seat_id]
    );
  };

  const handleBookingClick = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat.');
      return;
    }
    setOpenPayment(true);
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') formattedValue = formatCardNumber(value);
    else if (name === 'expiry') formattedValue = formatExpiry(value);

    setPaymentDetails((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const getPriceForRow = (row) => {
    if (!selectedShowtime) return 200;
    if (['A', 'B', 'C'].includes(row)) return parseFloat(selectedShowtime.price_classic) || 200;
    if (['D', 'E', 'F', 'G', 'H'].includes(row)) return parseFloat(selectedShowtime.price_prime) || 350;
    if (row === 'I') return parseFloat(selectedShowtime.price_recliner) || 550;
    if (row === 'J') return parseFloat(selectedShowtime.price_premium) || 870;
    return 200;
  };

  const totalPrice = selectedSeats
    .reduce((total, seatId) => {
      const seat = seats.find((s) => s.seat_id === seatId);
      return total + (seat ? getPriceForRow(seat.seat_row) : 0);
    }, 0)
    .toFixed(2);

  const handlePaymentSubmit = async () => {
    if (paymentDetails.cardNumber.length < 19 || paymentDetails.cvv.length < 3) {
      alert('Invalid Card Details.');
      return;
    }

    if (!isExpiryValid(paymentDetails.expiry)) {
      alert('Invalid expiry date. Please enter a valid future date in MM/YY format.');
      return;
    }

    setProcessingPayment(true);
    try {
      // fake delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const totalAmount = totalPrice;
      await eventService.bookTickets(
        selectedShowtime.showtime_id,
        selectedSeats,
        totalAmount,
        paymentDetails
      );

      setOpenPayment(false);
      alert('Payment Successful! Booking Confirmed.');
      fetchSeats(selectedShowtime);
      setSelectedSeats([]);
      setPaymentDetails({ cardNumber: '', expiry: '', cvv: '', name: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed.';
      setError(msg);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const backToMovies = () => {
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setShowtimes([]);
    setSeats([]);
  };

  const backToShowtimes = () => {
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setSeats([]);
  };

  // filters for landing page
  const genres = [
    'All',
    ...new Set(
      movies.map((movie) => (movie.genre ? movie.genre.split(',')[0].trim() : 'Other'))
    ),
  ];

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre =
      genreFilter === 'All' || (movie.genre && movie.genre.includes(genreFilter));
    return matchesSearch && matchesGenre;
  });

  // pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / moviesPerPage));
  const startIndex = (page - 1) * moviesPerPage;
  const paginatedMovies = filteredMovies.slice(startIndex, startIndex + moviesPerPage);

  const handlePageChange = (_event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAction = (movie, showtime = null) => {
    if (!isLoggedIn) {
      navigate('/login');
    } else if (showtime) {
      fetchSeats(showtime);
    } else {
      fetchShowtimes(movie);
    }
  };

  const renderContent = () => {
    // 3. Seat selection view
    if (selectedShowtime) {
      const seatRows = groupSeatsByRow(seats);
      const rowOrder = ['J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];

      return (
        <Box sx={{ mt: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={backToShowtimes} sx={{ mb: 2 }}>
            Back to Showtimes
          </Button>

          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {selectedMovie.title}
          </Typography>

          <Chip
            label={selectedMovie.genre || 'Movie'}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ mt: 1, mb: 2, fontWeight: 'bold' }}
          />
          <Typography
            variant="body1"
            sx={{ mb: 2, maxWidth: '800px', color: 'text.secondary' }}
          >
            {selectedMovie.description}
          </Typography>

          <Typography variant="h6" color="text.secondary" gutterBottom>
            {new Date(selectedShowtime.start_time).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
            })}{' '}
            • {selectedShowtime.cinema_name}
          </Typography>

          <Box sx={{ mt: 4, textAlign: 'center', overflowX: 'auto' }}>
            <Box
              sx={{
                display: 'inline-block',
                textAlign: 'center',
                p: 2,
                minWidth: '350px',
              }}
            >
              {rowOrder.map((rowLabel) => {
                if (!seatRows[rowLabel]) return null;

                let sectionTitle = null;
                if (rowLabel === 'J')
                  sectionTitle = `₹${selectedShowtime.price_premium || 870} PREMIUM RECLINER`;
                if (rowLabel === 'I')
                  sectionTitle = `₹${selectedShowtime.price_recliner || 550} RECLINER`;
                if (rowLabel === 'H')
                  sectionTitle = `₹${selectedShowtime.price_prime || 350} PRIME`;
                if (rowLabel === 'C')
                  sectionTitle = `₹${selectedShowtime.price_classic || 200} CLASSIC`;

                return (
                  <React.Fragment key={rowLabel}>
                    {sectionTitle && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textAlign: 'center',
                          mt: 3,
                          mb: 1,
                          color: '#777',
                          fontWeight: 'bold',
                        }}
                      >
                        {sectionTitle}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          width: '20px',
                          color: '#999',
                          fontWeight: 'bold',
                          mr: 2,
                        }}
                      >
                        {rowLabel}
                      </Typography>
                      {seatRows[rowLabel].map((seat, index) => (
                        <React.Fragment key={seat.seat_id}>
                          <span
                            style={seatStyle(
                              seat.status,
                              selectedSeats.includes(seat.seat_id)
                            )}
                            title={`Row ${seat.seat_row} Seat ${seat.seat_number} - ₹${getPriceForRow(
                              rowLabel
                            )}`}
                            onClick={() => handleSeatClick(seat)}
                          >
                            {seat.seat_number}
                          </span>
                          {rowLabel !== 'J' && index + 1 === 5 && (
                            <Box sx={{ width: '40px' }} />
                          )}
                        </React.Fragment>
                      ))}
                    </Box>
                  </React.Fragment>
                );
              })}
            </Box>

            <Box sx={{ mt: 6, mb: 4 }}>
              <Box
                sx={{
                  height: '40px',
                  width: '60%',
                  margin: '0 auto',
                  background: 'linear-gradient(to bottom, #e0f7fa, transparent)',
                  transform: 'perspective(200px) rotateX(-5deg)',
                  boxShadow: '0 -10px 20px rgba(0, 188, 212, 0.2)',
                  borderTop: '4px solid #00BCD4',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 1,
                  color: '#00BCD4',
                  letterSpacing: 2,
                }}
              >
                SCREEN THIS WAY
              </Typography>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleBookingClick}
                sx={{
                  fontSize: '1.1rem',
                  padding: '12px 40px',
                  borderRadius: '30px',
                }}
                disabled={selectedSeats.length === 0}
              >
                Book {selectedSeats.length > 0 ? `${selectedSeats.length}` : ''} Ticket(s)
              </Button>
            </Box>
          </Box>
        </Box>
      );
    }

    // 2. Showtimes for selected movie
    if (selectedMovie) {
      return (
        <Box sx={{ mt: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={backToMovies} sx={{ mb: 2 }}>
            Back to Movies
          </Button>

          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Showtimes:{' '}
            <span style={{ color: '#FFC107' }}>
              {selectedMovie.title}
            </span>
          </Typography>

          <Chip
            label={selectedMovie.genre || 'Movie'}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ mb: 1, fontWeight: 'bold' }}
          />
          <Typography
            variant="body1"
            sx={{ mb: 3, maxWidth: '800px', color: 'text.secondary' }}
          >
            {selectedMovie.description}
          </Typography>

          <Grid container spacing={3}>
            {showtimes.length > 0 ? (
              showtimes.map((show) => (
                <Grid item xs={12} sm={6} md={4} key={show.showtime_id}>
                  <Card
                    sx={{
                      bgcolor: '#1E1E1E',
                      borderRadius: 3,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                        borderColor: 'secondary.main',
                        border: '1px solid',
                      },
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {show.cinema_name}
                      </Typography>
                      <Typography color="white">
                        {show.location}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mt: 2, fontWeight: 'bold', color: 'white' }}
                      >
                        {new Date(show.start_time).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                        })}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#FFC107', fontWeight: 'bold' }}
                      >
                        Screen {show.screen_number}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleAction(null, show)}
                        sx={{
                          bgcolor: '#FFC107',
                          color: 'black',
                          fontWeight: 'bold',
                          '&:hover': { bgcolor: '#e0a800' },
                        }}
                      >
                        Select Seats
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            ) : (
              <Typography sx={{ m: 2 }}>No shows available.</Typography>
            )}
          </Grid>
        </Box>
      );
    }

    // 1. Public movie list with animations + pagination
    return (
      <Box
        sx={{
          animation: 'fadeIn 0.8s ease',
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      >
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Typography
            variant="h2"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #FFC107 30%, #FF8E53 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
            }}
          >
            Now Playing
          </Typography>

          <Paper
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              maxWidth: 600,
              margin: '0 auto',
              borderRadius: '50px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0',
            }}
          >
            <IconButton sx={{ p: '10px' }} aria-label="search">
              <SearchIcon />
            </IconButton>
            <TextField
              sx={{ ml: 1, flex: 1 }}
              placeholder="Search movies by title..."
              variant="standard"
              InputProps={{ disableUnderline: true }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
            <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
              <FilterListIcon color="action" sx={{ mr: 1 }} />
              <TextField
                select
                variant="standard"
                InputProps={{ disableUnderline: true }}
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                sx={{ minWidth: 100 }}
              >
                {genres.map((genre) => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Paper>
        </Box>

        {paginatedMovies.length > 0 ? (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '32px',
                '@keyframes fadeInUp': {
                  from: { opacity: 0, transform: 'translateY(20px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              {paginatedMovies.map((movie, index) => (
                <Card
                  key={movie.movie_id}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: '#1E1E1E',
                    borderRadius: 4,
                    border: '1px solid #333',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    opacity: 0,
                    animation: 'fadeInUp 0.6s ease forwards',
                    animationDelay: `${index * 0.07}s`,
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 15px 30px rgba(255, 193, 7, 0.15)',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      height="380"
                      image={movie.image_url}
                      alt={movie.title}
                      sx={{
                        objectFit: 'cover',
                        transition: 'transform 0.5s',
                        '&:hover': { transform: 'scale(1.05)' },
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '50%',
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                      }}
                    />
                  </Box>

                  <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
                    <Typography
                      gutterBottom
                      variant="h5"
                      component="h2"
                      sx={{ fontWeight: 'bold', color: 'white' }}
                    >
                      {movie.title}
                    </Typography>
                    <Chip
                      label={movie.genre || 'Movie'}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ mb: 2, fontWeight: 'bold' }}
                    />
                    <Typography
                      sx={{
                        color: 'white',
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3,
                        textOverflow: 'ellipsis',
                        fontSize: '0.9rem',
                      }}
                    >
                      {movie.description}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={() => handleAction(movie)}
                      sx={{ borderRadius: '20px', fontWeight: 'bold' }}
                    >
                      Book Tickets
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>

            {totalPages > 1 && (
              <Box
                sx={{
                  mt: 4,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                  size="large"
                />
              </Box>
            )}
          </>
        ) : (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" color="text.secondary">
              No movies found matching your search.
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ bgcolor: 'background.paper' }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              color: 'primary.main',
              fontWeight: 'bold',
            }}
          >
            MOVIE TICKET BOOKING
          </Typography>

          {isLoggedIn ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ mr: 2, color: 'text.secondary' }}>
                Welcome, {user?.user_name || 'User'}!
              </Typography>
              <Button
                color="inherit"
                onClick={() => navigate('/my-bookings')}
                sx={{
                  mr: 2,
                  color: 'text.primary',
                  fontWeight: 'bold',
                }}
              >
                My Bookings
              </Button>
              <IconButton
                onClick={handleProfileClick}
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
                  src={user?.avatar_url}
                >
                  {user?.user_name ? user.user_name[0].toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
              <IconButton color="primary" onClick={handleLogout} title="Logout">
                <LogoutIcon />
              </IconButton>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
              sx={{ py: 1 }}
            >
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {renderContent()}
      </Container>

      {isLoggedIn && (
        <Dialog
          open={openPayment}
          onClose={() => setOpenPayment(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle
            sx={{
              bgcolor: '#1E1E1E',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CreditCardIcon sx={{ color: '#FFC107' }} /> Secure Checkout
          </DialogTitle>
          <DialogContent sx={{ mt: 2, px: 3, pb: 3 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontWeight: 'bold', mt: 2, color: '#000' }}
            >
              Order Summary
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 2,
                p: 1.5,
                bgcolor: '#f5f5f5',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ color: '#000' }}>
                {selectedSeats.length} Tickets
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 'bold', color: '#000' }}
              >
                ₹{totalPrice}
              </Typography>
            </Box>

            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ color: '#000' }}
            >
              Card Details
            </Typography>

            <TextField
              fullWidth
              margin="dense"
              label="Cardholder Name"
              name="name"
              value={paymentDetails.name}
              onChange={handlePaymentChange}
              sx={{
                input: { color: 'black' },
                label: { color: 'black' },
              }}
            />

            <TextField
              fullWidth
              margin="dense"
              label="Card Number"
              name="cardNumber"
              value={paymentDetails.cardNumber}
              onChange={handlePaymentChange}
              placeholder="0000 0000 0000 0000"
              inputProps={{ maxLength: 19 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCardIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{
                input: { color: 'black' },
                label: { color: 'black' },
              }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Expiry (MM/YY)"
                  name="expiry"
                  value={paymentDetails.expiry}
                  onChange={handlePaymentChange}
                  inputProps={{ maxLength: 5 }}
                  sx={{
                    input: { color: 'black' },
                    label: { color: 'black' },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  margin="dense"
                  label="CVV"
                  name="cvv"
                  type="password"
                  value={paymentDetails.cvv}
                  onChange={handlePaymentChange}
                  inputProps={{ maxLength: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    input: { color: 'black' },
                    label: { color: 'black' },
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <img
                src="https://img.icons8.com/color/48/000000/visa.png"
                alt="visa"
                style={{ height: 30, marginRight: 10 }}
              />
              <img
                src="https://img.icons8.com/color/48/000000/mastercard.png"
                alt="mastercard"
                style={{ height: 30 }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenPayment(false)} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              variant="contained"
              color="success"
              disabled={processingPayment}
              fullWidth
              sx={{ py: 1.5, fontWeight: 'bold' }}
            >
              {processingPayment ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Pay ₹${totalPrice}`
              )}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Dashboard;
