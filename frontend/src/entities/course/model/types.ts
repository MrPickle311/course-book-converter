export interface TaskOption { id: string; label: string }

export interface TaskEvaluation {
    isCorrect: boolean;
    mistakes: string[];
    score?: number;
}

export interface Task {
    id: string;
    question: string;
    type: 'multiple-choice' | 'multiple-select' | 'short-answer' | 'upload-pdf' | 'code';
    options?: TaskOption[];
    correctAnswerId?: string;
    correctAnswerIds?: string[];
    userAnswer?: string;
    userAnswers?: string[];
    userFileName?: string;
    evaluation?: TaskEvaluation;
    completed: boolean;
}

export interface Course {
    id: string;
    bookId: string;
    bookTitle: string;
    chapterId: string;
    chapterTitle: string;
    notes: string;
    tasks: Task[];
    createdDate: string;
    completed: boolean;
    userId: string;
}
