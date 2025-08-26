import axios, { type AxiosRequestConfig } from 'axios';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';
const USE_MOCKS = ((import.meta as any).env?.VITE_USE_MOCKS ?? '1') !== '0';

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
	const payload = {
		success: true,
		data: {
			title: chapterTitle,
			objectives: [
				'Understand the core ideas of the chapter',
				'Identify key concepts and APIs',
			],
			sections: [
				{ title: 'Overview', summary: `${chapterTitle}: overview and motivation`, keyConcepts: ['concept A', 'concept B'] },
				{ title: 'Key Ideas', summary: 'Important ideas with small examples', keyConcepts: ['idea 1', 'idea 2'] },
			],
			tasks: [
				{ type: 'reading', title: 'Summarize the section', description: 'Write 5 bullet points', successCriteria: ['clear', 'concise'] },
				{ type: 'practice', title: 'Apply concept', description: 'Explain with your own words', successCriteria: ['accurate', 'grounded'] },
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

// Override post to short-circuit with mocks when enabled
const realPost = api.post.bind(api);
api.post = async function(url: string, data?: any, config?: AxiosRequestConfig) {
	const mock = await maybeMock({ url, method: 'post', data, ...(config || {}) });
	if (mock) return mock as any;
	return realPost(url, data, config);
};

export default api;
