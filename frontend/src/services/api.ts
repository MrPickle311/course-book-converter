import axios from 'axios';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
	baseURL: BASE_URL,
	timeout: 120000, // 2 minutes default
	headers: {
		'Content-Type': 'application/json',
	},
});

export default api;
