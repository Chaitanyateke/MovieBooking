// src/api/events.js
import axios from 'axios';

// 🔴 OLD – not available on Vercel
// const EVENTS_API_URL = 'http://localhost:5000/api/events';
// const PUBLIC_MOVIES_URL = 'http://localhost:5000/api/public/movies';

// 🟢 NEW – use your Render backend
const BASE_URL = 'https://moviebooking-backend-4ups.onrender.com';
const EVENTS_API_URL = `${BASE_URL}/api/events`;
const PUBLIC_MOVIES_URL = `${BASE_URL}/api/public/movies`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { headers: { 'x-auth-token': token } };
};

// PUBLIC: no token required
export const getPublicMovies = () => {
  return axios.get(PUBLIC_MOVIES_URL);
};

// PRIVATE: requires auth
export const getMovies = () => {
  return axios.get(`${EVENTS_API_URL}/movies`, getAuthHeaders());
};

export const getShowtimes = (movieId) => {
  return axios.get(`${EVENTS_API_URL}/showtimes/${movieId}`, getAuthHeaders());
};

export const getSeatsForShowtime = (showtimeId) => {
  return axios.get(`${EVENTS_API_URL}/seats/${showtimeId}`, getAuthHeaders());
};

export const bookTickets = (showtimeId, seatIds, totalAmount, paymentDetails) => {
  return axios.post(
    `${EVENTS_API_URL}/book`,
    { showtimeId, seatIds, totalAmount, paymentDetails },
    getAuthHeaders()
  );
};

export const getUserBookings = () => {
  return axios.get(`${EVENTS_API_URL}/my-bookings`, getAuthHeaders());
};

export const cancelBooking = (bookingId) => {
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
