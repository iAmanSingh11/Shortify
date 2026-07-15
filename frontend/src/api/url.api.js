import api from './axios.js';

export const createShortUrl = (payload) => api.post('/urls', payload);
export const fetchUserUrls = (params) => api.get('/urls', { params });
export const fetchUrlById = (id) => api.get(`/urls/${id}`);
export const updateUrl = (id, payload) => api.patch(`/urls/${id}`, payload);
export const deleteUrl = (id) => api.delete(`/urls/${id}`);
export const fetchQrCode = (id) => api.get(`/urls/${id}/qrcode`);
export const verifyLinkPassword = (shortCode, password) =>
  api.post(`/redirect/${shortCode}/verify`, { password });
