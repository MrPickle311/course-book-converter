export type ProgressData = {
    tasksCount: number;
    tasksCompleted: number;
    tasksFailed: number;
};

export enum BookStatus {
    GENERATED = 'GENERATED',
    GENERATING = 'GENERATING',
}

export type Chapter = {
    chapterId: string;
    title: string;
    startPage: number;
    endPage: number;
    isGenerated: boolean;
    status: 'NOT_GENERATED' | 'GENERATING' | 'GENERATED';
    progressData?: ProgressData;
};

export type Book = {
    id: string;
    title: string;
    uploadDate: string;
    chapters: Array<Chapter>;
    status: BookStatus,
    progressData?: ProgressData;
    lastUsedAt?: string | null;
    generatedCoursesCount?: number;
};