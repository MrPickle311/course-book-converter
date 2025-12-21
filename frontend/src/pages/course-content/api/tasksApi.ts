import { DefaultService as defaultService, type TaskEvaluation as TaskEvaluationDto, TaskSubmissionRequest } from '@/shared/api/openapi';
import type { Task, TaskEvaluation } from '@/entities/course/model/types.ts';

const mapEvaluation = (raw: TaskEvaluationDto | undefined): TaskEvaluation | undefined => {
    if (!raw) return undefined;
    return {
        isCorrect: Boolean(raw.isCorrect),
        mistakes: raw.mistakes || [],
        score: typeof raw.score === 'number' ? raw.score : undefined,
    };
};

export const tasksApi = {
    getChapterTasks: async (bookId: string, chapterId: string): Promise<Task[]> => {
        const res = await defaultService.getChapterTasks({ uploadId: bookId, chapterId });
        const items = res?.tasks || [];
        return items.map((tw: any) => {
            const def = tw.definition;
            const st = tw.state || {};
            const type = def.type as Task['type'];
            const opts = Array.isArray(def.options) ? def.options.map((o: any) => ({ id: o.id, label: o.label })) : undefined;
            return {
                id: def.id,
                question: def.question,
                type,
                options: opts,
                correctAnswerId: def.correctAnswerId,
                correctAnswerIds: def.correctAnswerIds,
                userAnswer: st.userAnswer,
                userAnswers: st.userAnswers,
                userFileName: st.userFileName,
                evaluation: st.evaluation ? mapEvaluation(st.evaluation) : undefined,
                completed: st.completed
            } as Task;
        });
    },

    submitMultiSelect: async (taskId: string, selectedOptionIds: string[]): Promise<TaskEvaluation | undefined> => {
        const resp = await defaultService.submitTask({
            taskId,
            requestBody: { type: TaskSubmissionRequest.type.MULTIPLE_SELECT, selectedOptionIds },
        });
        return mapEvaluation(resp.evaluation);
    },

    submitPdfUpload: async (taskId: string, file: File): Promise<TaskEvaluation | undefined> => {
        const resp = await defaultService.submitTaskFile({
            taskId,
            formData: { file }
        });
        return mapEvaluation(resp.evaluation);
    },

    submitTextAnswer: async (taskId: string, textAnswer: string): Promise<TaskEvaluation | undefined> => {
        const resp = await defaultService.submitTask({
            taskId,
            requestBody: {
                type: TaskSubmissionRequest.type.SHORT_ANSWER,
                textAnswer
            },
        });
        return mapEvaluation(resp.evaluation);
    },

    submitMultipleChoice: async (taskId: string, selectedOptionId: string): Promise<TaskEvaluation | undefined> => {
        const resp = await defaultService.submitTask({
            taskId,
            requestBody: { type: TaskSubmissionRequest.type.MULTIPLE_CHOICE, selectedOptionId },
        });
        return mapEvaluation(resp.evaluation);
    }
};
