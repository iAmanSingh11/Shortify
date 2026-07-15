import api from './axios.js';

export const fetchDashboardOverview = () => api.get('/analytics/overview');
export const fetchUrlAnalytics = (id, range = '30d') => api.get(`/analytics/${id}`, { params: { range } });
