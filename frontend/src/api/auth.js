import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { headers: { 'x-auth-token': token } };
};

const register = (name, email, password, mobile) => {
  return axios.post(`${API_URL}/register`, { name, email, password, mobile });
};

const verifyOTP = (email, otp) => {
  return axios.post(`${API_URL}/verify-otp`, { email, otp })
    .then((response) => {
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    });
};

// Unified login for both User (Email/Mobile) and Admin (Email)
const login = (identifier, password) => {
  return axios.post(`${API_URL}/login`, { identifier, password })
    .then((response) => {
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    });
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const updateProfile = (profileData) => axios.put(`${API_URL}/profile`, profileData, getAuthHeaders());
const changePassword = (oldPassword, newPassword) => axios.put(`${API_URL}/change-password`, { oldPassword, newPassword }, getAuthHeaders());

const authService = {
  register,
  verifyOTP,
  login,
  logout,
  updateProfile,
  changePassword,
};

export default authService;