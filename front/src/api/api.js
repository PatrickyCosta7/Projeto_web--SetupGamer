import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const API = axios.create({ baseURL: BASE });

export const register = (payload) => API.post('/auth/register', payload);
export const login = (payload) => API.post('/auth/login', payload);
export const searchGames = (q) => API.get('/games/search', { params: { q } });
export const getGame = (id) => API.get(`/games/${id}`);
export const buildSetup = (id, token) => API.post(`/games/${id}/build`, {}, { headers: { Authorization: `Bearer ${token}` } });
export const buildSetupWithBudget = (id, budget, token) => API.post(`/games/${id}/build-with-budget`, { budget }, { headers: { Authorization: `Bearer ${token}` } });
export const updateSetup = (setupId, data, token) => API.put(`/games/setups/${setupId}`, data, { headers: { Authorization: `Bearer ${token}` } });

export default API;
