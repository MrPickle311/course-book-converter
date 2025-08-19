import api from './api';

export type HealthStatus = 'healthy' | 'degraded' | 'unknown';

export interface HealthResponse {
	status: HealthStatus;
	message: string;
	database: 'connected' | 'disconnected' | 'error' | string;
	timestamp: string;
}

export async function getHealth(): Promise<HealthResponse> {
	const res = await api.get<HealthResponse>('/health/');
	return res.data;
}
