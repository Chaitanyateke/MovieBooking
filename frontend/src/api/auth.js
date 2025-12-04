// frontend/src/api/auth.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth'; // change to Render URL later

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { headers: { 'x-auth-token': token } };
};

const register = (name, email, password, mobile) => {
  return axios
    .post(`${API_URL}/register`, { name, email, password, mobile })
    .then((response) => {
      // backend now returns token + user
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    });
};

// you won’t need this anymore, but can keep it unused
const verifyOTP = (email, otp) => {
  console.warn('verifyOTP is no longer used');
  return Promise.reject('OTP disabled');
};

// login stays same
const login = (identifier, password) => {
  return axios.post(`${API_URL}/login`, { identifier, password }).then((res) => {
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  });
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const updateProfile = (profileData) =>
  axios.put(`${API_URL}/profile`, profileData, getAuthHeaders());
const changePassword = (oldPassword, newPassword) =>
  axios.put(
    `${API_URL}/change-password`,
    { oldPassword, newPassword },
    getAuthHeaders()
  );

const authService = {
  register,
  verifyOTP, // unused now
  login,
  logout,
  updateProfile,
  changePassword,
};

export default authService;
