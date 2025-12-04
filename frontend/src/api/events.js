import axios from 'axios';

// Use Render backend URL
const EVENTS_API_URL = 'https://moviebooking-backend-4ups.onrender.com/api/events';
const PUBLIC_MOVIES_URL = 'https://moviebooking-backend-4ups.onrender.com/api/public/movies';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { headers: { 'x-auth-token': token } };
};

// PUBLIC: no token required
const getPublicMovies = () => {
  return axios.get(PUBLIC_MOVIES_URL);
};

// PRIVATE: requires auth
const getMovies = () => {
  return axios.get(`${EVENTS_API_URL}/movies`, getAuthHeaders());
};

const getShowtimes = (movieId) => {
  return axios.get(`${EVENTS_API_URL}/showtimes/${movieId}`, getAuthHeaders());
};

const getSeatsForShowtime = (showtimeId) => {
  return axios.get(`${EVENTS_API_URL}/seats/${showtimeId}`, getAuthHeaders());
};

const bookTickets = (showtimeId, seatIds, totalAmount, paymentDetails) => {
  return axios.post(
    `${EVENTS_API_URL}/book`,
    { showtimeId, seatIds, totalAmount, paymentDetails },
    getAuthHeaders()
  );
};

const getUserBookings = () => {
  return axios.get(`${EVENTS_API_URL}/my-bookings`, getAuthHeaders());
};

const cancelBooking = (bookingId) => {
  return axios.delete(`${EVENTS_API_URL}/bookings/${bookingId}`, getAuthHeaders());
};

const eventService = {
  getPublicMovies,
  getMovies,
  getShowtimes,
  getSeatsForShowtime,
  bookTickets,
  getUserBookings,
  cancelBooking,
};

export default eventService;
