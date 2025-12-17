export type ProgressData = {
    tasksCount: number;
    tasksCompleted: number;
    tasksFailed: number;
};

export type Chapter = {
    chapterId: string;
    title: string;
    startPage: number;
    endPage: number;
    isGenerated: boolean;
    progressData?: ProgressData;
};

export type Book = {
    id: string;
    title: string;
    uploadDate: string;
    chapters: Array<Chapter>;
    progressData?: ProgressData;
    lastUsedAt?: string | null;
    generatedCoursesCount?: number;
};