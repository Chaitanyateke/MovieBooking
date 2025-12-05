import axios from 'axios';

const API_URL = 'https://moviebooking-backend-4ups.onrender.com/api/auth';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { headers: { 'x-auth-token': token } };
};

// REGISTER – directly logs user in (no OTP)
const register = (name, email, password, mobile) => {
  return axios
    .post(`${API_URL}/register`, { name, email, password, mobile })
    .then((response) => {
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    });
};

// LOGIN (email or mobile + password)
const login = (identifier, password) => {
  return axios
    .post(`${API_URL}/login`, { identifier, password })
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

const updateProfile = (profileData) =>
  axios.put(`${API_URL}/profile`, profileData, getAuthHeaders());

const changePassword = (oldPassword, newPassword) =>
  axios.put(`${API_URL}/change-password`, { oldPassword, newPassword }, getAuthHeaders());

const authService = {
  register,
  login,
  logout,
  updateProfile,
  changePassword,
};

export default authService;
