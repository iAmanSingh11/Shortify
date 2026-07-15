import api from './axios.js';

export const fetchApiKeys = () => api.get('/api-keys');
export const createApiKey = (payload) => api.post('/api-keys', payload);
export const revokeApiKey = (id) => api.delete(`/api-keys/${id}`);
