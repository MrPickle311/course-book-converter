import axios, { type AxiosRequestConfig } from 'axios';
import { OpenAPI } from '@/openapi';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';
const USE_MOCKS = 1

export const api = axios.create({
	baseURL: BASE_URL,
	timeout: 120000,
	headers: {
		'Content-Type': 'application/json',
	},
});

function mockDelay<T>(data: T, ms = 400): Promise<{ data: T; status: number }> {
	return new Promise(resolve => setTimeout(() => resolve({ data, status: 200 }), ms));
}

function mockProcessResponse() {
	const chapters = [
		'Introduction to Apache Spark: A Unified Analytics Engine',
		'Downloading Apache Spark and Getting Started',
		"Apache Spark's Structured APIs",
		'Spark SQL and DataFrames: Introduction to Built-in Data Sources',
		'Spark SQL and DataFrames: Interacting with External Data Sources',
		'Spark SQL and Datasets',
		'Optimizing and Tuning Spark Applications',
		'Structured Streaming',
		'Building Reliable Data Lakes with Apache Spark',
		'Machine Learning with MLlib',
		'Managing, Deploying, and Scaling ML Pipelines with Apache Spark',
		'Epilogue: Apache Spark 3.0',
	];
	let page = 2;
	const payload = {
		success: true,
		message: 'PDF processed successfully',
		data: {
			uploadId: 'mock-upload-id',
			pageCount: 399,
			wordCount: 100184,
			chapters: chapters.map((title, idx) => {
				const start = page;
				const end = start + (idx % 2 === 0 ? 21 : 40);
				page = end + 1;
				return { title, level: 1, startPage: start, endPage: end };
			}),
			structuredCounts: {},
			images: 0,
			tables: 0,
			cleanText: {},
		},
	};
	return payload;
}

function mockGenerateResponse(chapterTitle: string) {
	const longText = (i: number) =>
		`${chapterTitle} — Section ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ` +
		`Suspendisse id dui sit amet nisl dignissim fermentum. Integer efficitur, ` +
		`elit vitae facilisis viverra, nunc nulla facilisis tellus, nec rutrum nisl nunc et justo.`;

	const codeSample = `// Example: ${chapterTitle}\nval spark = SparkSession.builder().getOrCreate()\nval df = spark.read.json("/path/events.json")\ndf.select("user", "action").show()`;

	const tablePayload = {
		headers: ['Column', 'Type', 'Description'],
		rows: [
			['user', 'string', 'User identifier'],
			['action', 'string', 'Event action'],
			['ts', 'timestamp', 'Event time'],
		],
	};

	const pictureUrl = 'https://via.placeholder.com/1200x320?text=Diagram';

	const sections = [
		{ title: 'Overview', kind: 'text', summary: longText(1) },
		{ title: 'Quick Start Code', kind: 'code', summary: 'Minimal working example', payload: codeSample },
		{ title: 'Schema Table', kind: 'table', summary: 'Core columns used in examples', payload: tablePayload },
		{ title: 'Concept Diagram', kind: 'picture', summary: 'High-level architecture', payload: pictureUrl },
		...Array.from({ length: 8 }, (_, i) => ({ title: `Deep Dive ${i + 1}`, kind: 'text', summary: longText(i + 2) })),
	];

	const payload = {
		success: true,
		data: {
			title: chapterTitle,
			sections,
			tasks: [
				{ type: 'reading', title: 'Skim and annotate', description: 'Highlight 3 key ideas', successCriteria: ['clear', 'grounded'] },
				{ type: 'practice', title: 'Explain a concept', description: 'Describe one idea in your own words', successCriteria: ['accurate'] },
		],
		},
	};
	return payload;
}

async function maybeMock(config: AxiosRequestConfig) {
	if (!USE_MOCKS || config.method?.toLowerCase() !== 'post' || typeof config.url !== 'string') return null;
	if (config.url.endsWith('/api/v1/pdf/process')) {
		return mockDelay(mockProcessResponse());
	}
	if (config.url.endsWith('/api/v1/course/generate')) {
		const body = (config.data && typeof config.data === 'string') ? JSON.parse(config.data) : (config.data || {});
		return mockDelay(mockGenerateResponse(String(body.chapterTitle || 'Chapter')));
	}
	return null;
}

// Global axios interceptors so generated clients are also mocked
axios.interceptors.request.use(async (config) => {
	const mock = await maybeMock(config);
	if (mock) {
		// mark mock by throwing a special error the response interceptor will catch
		return Promise.reject({ isMock: true, __mockResponse: mock });
	}
	return config;
});

axios.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error && error.isMock && error.__mockResponse) {
			return Promise.resolve(error.__mockResponse);
		}
		return Promise.reject(error);
	}
);

// Dedicated client post override still works for explicit api.post users
const realPost = api.post.bind(api);
api.post = async function(url: string, data?: any, config?: AxiosRequestConfig) {
	const mock = await maybeMock({ url, method: 'post', data, ...(config || {}) });
	if (mock) return mock as any;
	return realPost(url, data, config);
};

// Configure generated OpenAPI client to use the same base URL
OpenAPI.BASE = BASE_URL;

export default api;
