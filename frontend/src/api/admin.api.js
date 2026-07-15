import api from './axios.js';

export const fetchAdminOverview = () => api.get('/admin/overview');

export const fetchAdminUsers = (params) => api.get('/admin/users', { params });
export const updateUserRole = (id, role) => api.patch(`/admin/users/${id}/role`, { role });
export const updateUserStatus = (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive });
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);

export const fetchAdminLinks = (params) => api.get('/admin/links', { params });
export const deleteAdminLink = (id) => api.delete(`/admin/links/${id}`);

export const fetchAuditLogs = (params) => api.get('/admin/audit-logs', { params });
