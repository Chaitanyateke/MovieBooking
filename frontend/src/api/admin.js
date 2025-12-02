import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { 'x-auth-token': token } };
};

// ... existing functions ...
const addMovie = (movieData) => axios.post(`${API_URL}/admin/movies`, movieData, getAuthHeaders());
const deleteMovie = (movieId) => axios.delete(`${API_URL}/admin/movies/${movieId}`, getAuthHeaders());
const getAllMovies = () => axios.get(`${API_URL}/events/movies`, getAuthHeaders());
const getAllUsers = () => axios.get(`${API_URL}/admin/users`, getAuthHeaders());
const deleteUser = (userId) => axios.delete(`${API_URL}/admin/users/${userId}`, getAuthHeaders());
const getUserDetails = (userId) => axios.get(`${API_URL}/admin/users/${userId}`, getAuthHeaders());
const deleteBooking = (bookingId) => axios.delete(`${API_URL}/admin/bookings/${bookingId}`, getAuthHeaders());
const getAllShowtimes = () => axios.get(`${API_URL}/admin/showtimes`, getAuthHeaders());
const addShowtime = (data) => axios.post(`${API_URL}/admin/showtimes`, data, getAuthHeaders());
const deleteShowtime = (id) => axios.delete(`${API_URL}/admin/showtimes/${id}`, getAuthHeaders());
const getAllPayments = () => axios.get(`${API_URL}/admin/payments`, getAuthHeaders());

// --- NEW: Notification API Calls ---
const getNotifications = () => axios.get(`${API_URL}/admin/notifications`, getAuthHeaders());
const markNotificationsRead = () => axios.put(`${API_URL}/admin/notifications/read`, {}, getAuthHeaders());

const adminService = {
  addMovie, deleteMovie, getAllMovies,
  getAllUsers, deleteUser, getUserDetails, deleteBooking,
  addShowtime, getAllShowtimes, deleteShowtime,
  getAllPayments,
  getNotifications, markNotificationsRead // <-- Exports
};

export default adminService;