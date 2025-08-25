import api from './api';

export interface GenerateCourseBody {
	chapterTitle: string;
	context?: string;
}

export interface CourseModule {
	title: string;
	objectives: string[];
	sections: { title: string; summary: string; keyConcepts: string[] }[];
	tasks: { type: string; title: string; description: string; successCriteria: string[] }[];
}

export async function generateCourse(body: GenerateCourseBody): Promise<CourseModule> {
	const res = await api.post('/api/v1/course/generate', body);
	return res.data?.data as CourseModule;
}
