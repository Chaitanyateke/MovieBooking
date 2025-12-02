import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../api/events';

// --- MUI Imports ---
import { 
  Box, Container, Typography, Card, CardContent, CardMedia, Grid, Chip, Divider, Button, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab,
  Paper, // <-- Explicitly imported
  DialogContentText // <-- Explicitly imported
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import HistoryIcon from '@mui/icons-material/History';
import UpcomingIcon from '@mui/icons-material/Upcoming';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // 0 for Upcoming, 1 for History

  // Cancel Confirmation State
  const [openConfirm, setOpenConfirm] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await eventService.getUserBookings();
      setBookings(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate('/dashboard');

  const confirmCancel = (id) => {
    setBookingToCancel(id);
    setOpenConfirm(true);
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    try {
      await eventService.cancelBooking(bookingToCancel);
      // Remove from local state
      setBookings(prev => prev.filter(b => b.booking_id !== bookingToCancel));
      setOpenConfirm(false);
    } catch (err) {
      alert("Failed to cancel booking. It may be too late to cancel.");
      setOpenConfirm(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter bookings based on date
  const now = new Date();
  const upcomingBookings = bookings.filter(b => new Date(b.start_time) >= now);
  const pastBookings = bookings.filter(b => new Date(b.start_time) < now);

  const displayedBookings = tabValue === 0 ? upcomingBookings : pastBookings;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pb: 4 }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', boxShadow: 1, py: 2, px: 3, mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBack} sx={{ mr: 2, color: 'black' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">My Bookings</Typography>
      </Box>

      <Container maxWidth="md">
        
        {/* Tabs for Upcoming / History */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            indicatorColor="primary" 
            textColor="primary" 
            variant="fullWidth"
          >
            <Tab icon={<UpcomingIcon />} label="Upcoming" />
            <Tab icon={<HistoryIcon />} label="History" />
          </Tabs>
        </Paper>

        {displayedBookings.length === 0 && !loading ? (
          <Box textAlign="center" mt={8}>
            <Typography variant="h6" color="text.secondary">
              {tabValue === 0 ? "No upcoming bookings found." : "No booking history found."}
            </Typography>
            {tabValue === 0 && (
              <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleBack}>
                Book a Movie
              </Button>
            )}
          </Box>
        ) : (
          displayedBookings.map((booking) => {
            const isPast = tabValue === 1; 

            return (
            <Card 
              key={booking.booking_id} 
              sx={{ 
                display: 'flex', 
                mb: 3, 
                borderRadius: 4, 
                overflow: 'hidden', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                flexDirection: { xs: 'column', sm: 'row' },
                opacity: isPast ? 0.8 : 1, // Dim past bookings slightly
                bgcolor: isPast ? '#fafafa' : 'white'
              }}
            >
              {/* Movie Poster */}
              <CardMedia
                component="img"
                sx={{ width: { xs: '100%', sm: 180 }, height: { xs: 250, sm: 'auto' }, objectFit: 'cover', filter: isPast ? 'grayscale(80%)' : 'none' }}
                image={booking.image_url}
                alt={booking.title}
              />

              {/* Ticket Details */}
              <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2 }}>
                <CardContent sx={{ flex: '1 0 auto', pb: 0 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography component="div" variant="h5" fontWeight="bold">
                        {booking.title}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                        {booking.duration_mins} mins
                        </Typography>
                    </Box>
                    <Chip 
                      label={isPast ? "COMPLETED" : `₹${booking.total_amount || '0'}`} 
                      color={isPast ? "default" : "success"} 
                      size="small" 
                      sx={{ fontWeight: 'bold', borderRadius: 1 }}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <EventIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2" fontWeight="500">
                          {new Date(booking.start_time).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <PlaceIcon color="action" sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {booking.cinema_name} (Screen {booking.screen_number})
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        SEATS ({booking.total_tickets})
                      </Typography>
                      <Typography variant="body1" color="primary" fontWeight="bold">
                        {booking.seat_numbers}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
                
                {/* Footer */}
                <Box sx={{ mt: 2, p: 2, bgcolor: isPast ? '#f0f0f0' : '#fafafa', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon fontSize="small" color="disabled" />
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            TXN: {booking.transaction_id ? booking.transaction_id.slice(0, 8).toUpperCase() : 'N/A'}...
                        </Typography>
                      </Box>
                      {booking.card_number_mask && (
                        <Typography variant="caption" color="text.secondary">
                           Paid via {booking.card_number_mask}
                        </Typography>
                      )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <QrCode2Icon sx={{ fontSize: 30, color: '#bdbdbd' }} />
                         <Typography variant="caption" color="text.secondary">
                           {isPast ? "Ticket Expired" : "Scan at entry"}
                         </Typography>
                     </Box>
                     
                     {/* CANCEL BUTTON - Only show if show hasn't started (Tab 0) */}
                     {tabValue === 0 && (
                       <Button 
                          variant="outlined" 
                          color="error" 
                          size="small" 
                          startIcon={<DeleteForeverIcon />}
                          onClick={() => confirmCancel(booking.booking_id)}
                       >
                          Cancel Booking
                       </Button>
                     )}
                  </Box>
                </Box>
              </Box>
            </Card>
            );
          })
        )}
      </Container>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Cancel Booking?</DialogTitle>
        <DialogContent>
          {/* FIX: DialogContentText was imported as DialogText */}
          <DialogContentText> 
            Are you sure you want to cancel this booking? This action cannot be undone and your seats will be released.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>No, Keep it</Button>
          <Button onClick={handleCancelBooking} color="error" variant="contained">
            Yes, Cancel Ticket
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyBookings;