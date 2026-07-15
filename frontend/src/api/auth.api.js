import api from './axios.js';

export const registerUser = (payload) => api.post('/auth/register', payload);
export const loginUser = (payload) => api.post('/auth/login', payload);
export const logoutUser = () => api.post('/auth/logout');
export const refreshSession = () => api.post('/auth/refresh');
export const fetchCurrentUser = () => api.get('/auth/me');
