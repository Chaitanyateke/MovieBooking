import axios from 'axios';

const API_URL = 'http://localhost:5000/api/events';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return {};
  }
  return { headers: { 'x-auth-token': token } };
};

const getMovies = () => {
  return axios.get(`${API_URL}/movies`, getAuthHeaders());
};

const getShowtimes = (movieId) => {
  return axios.get(`${API_URL}/showtimes/${movieId}`, getAuthHeaders());
};

const getSeatsForShowtime = (showtimeId) => {
  return axios.get(`${API_URL}/seats/${showtimeId}`, getAuthHeaders());
};

// Updated to accept totalAmount and paymentDetails
const bookTickets = (showtimeId, seatIds, totalAmount, paymentDetails) => {
  const API_BOOK_URL = 'http://localhost:5000/api/events/book'; // Ensure correct URL
  return axios.post(
    API_BOOK_URL,
    { showtimeId, seatIds, totalAmount, paymentDetails },
    getAuthHeaders()
  );
};

const getUserBookings = () => {
  return axios.get(`${API_URL}/my-bookings`, getAuthHeaders());
};
const cancelBooking = (bookingId) => {
  return axios.delete(`${API_URL}/bookings/${bookingId}`, getAuthHeaders());
};

const eventService = {
  getMovies,
  getShowtimes,
  getSeatsForShowtime,
  bookTickets,
  getUserBookings,
  cancelBooking,
};

export default eventService;