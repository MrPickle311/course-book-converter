import { useState, useEffect } from 'react';
import  { type Course, coursesApi, type Task, type TaskEvaluation } from '@/entities/course';
import { tasksApi } from '@/entities/course';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useCourse(course: Course) {
    const [activeTab, setActiveTab] = useState('notes');
    const [taskAnswers, setTaskAnswers] = useState<Record<string, string | string[] | File | null>>({});
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
    const [localTasks, setLocalTasks] = useState<Task[]>([]);

    const queryClient = useQueryClient();
    const { data: fetchedTasks } = useQuery({
        queryKey: ['course', course.bookId, course.chapterId, 'tasks'],
        queryFn: () => tasksApi.getChapterTasks(course.bookId, course.chapterId),
        enabled: !!course.bookId && !!course.chapterId,
        refetchOnWindowFocus: false
    });

    useEffect(function setLocalTasksWhenFetched() {
        if (fetchedTasks) {
            setLocalTasks(fetchedTasks);
        }
    }, [fetchedTasks]);

    const tasks = localTasks;
    const completedTasks = tasks.filter(task => task.completed).length;
    const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    const isTaskCorrect = (task: Task): boolean | null => {
        if (!task.completed) {
            return null;
        }
        if (task.type === 'multiple-select') {
            return task.evaluation?.isCorrect === true;
        }
        if (task.type === 'multiple-choice') {
            if (Array.isArray(task.correctAnswerIds) && task.correctAnswerIds.length > 0) {
                return task.evaluation?.isCorrect === true;
            }
            return task.userAnswer === task.correctAnswerId;
        }
        if (task.type === 'short-answer' || task.type === 'code' || task.type === 'upload-pdf') {
            return task.evaluation?.isCorrect === true;
        }
        return null;
    };

    const updateLocalTasks = (newTasks: Task[]) => {
        setLocalTasks(newTasks);
    };

    const openFilePicker = (taskId: string) => {
        const input = document.getElementById(`file-input-${taskId}`) as HTMLInputElement | null;
        if (input) input.click();
    };

    const handleTaskAnswer = (taskId: string, answer: string | string[] | File | null) => {
        setTaskAnswers(prev => ({ ...prev, [taskId]: answer }));
    };

    const toggleMultiSelectOption = (taskId: string, optionId: string) => {
        setTaskAnswers(prev => {
            const current = (prev[taskId] as string[] | undefined) || [];
            const exists = current.includes(optionId);
            const next = exists ? current.filter(o => o !== optionId) : [...current, optionId];
            return { ...prev, [taskId]: next };
        });
    };

    const handleRetakeTask = (task: Task) => {
        const resetTask: Task = {
            ...task,
            userAnswer: undefined,
            userAnswers: undefined,
            userFileName: undefined,
            feedback: undefined,
            evaluation: undefined,
            completed: false
        } as Task;
        setTaskAnswers(prev => {
            const next = { ...prev };
            delete next[task.id];
            return next;
        });
        const updatedTasks = tasks.map(t => t.id === task.id ? resetTask : t);
        updateLocalTasks(updatedTasks);
    };

    const handleSubmitTask = (task: Task) => {
        const answer = taskAnswers[task.id];

        const updateTaskWithResult = (evaluation: TaskEvaluation | undefined, extraFields: Partial<Task>) => {
            const updatedTask = {
                ...task,
                ...extraFields,
                evaluation,
                completed: true,
            } as Task;
            const updatedTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
            updateLocalTasks(updatedTasks);
            queryClient.setQueryData(['course', course.bookId, course.chapterId, 'tasks'], updatedTasks);
        };

        const executeSubmit = async (apiCall: () => Promise<TaskEvaluation | undefined>, updatePayload: Partial<Task>) => {
            setSubmitting(prev => ({ ...prev, [task.id]: true }));
            try {
                const evaluation = await apiCall();
                updateTaskWithResult(evaluation, updatePayload);
            } catch (e) {
                console.error('Submit failed', e);
            } finally {
                setSubmitting(prev => ({ ...prev, [task.id]: false }));
            }
        };

        if (task.type === 'multiple-select') {
            const list = (answer as string[] | undefined) || [];
            if (list.length === 0) return;
            executeSubmit(() => tasksApi.submitMultiSelect(task.id, list), { userAnswers: list });
            return;
        }

        if (task.type === 'upload-pdf') {
            const file = answer as File | undefined;
            if (!file) return;
            executeSubmit(() => tasksApi.submitPdfUpload(task.id, file), { userFileName: file.name });
            return;
        }

        const userAnswer = (answer as string | undefined) || '';
        if (!userAnswer) return;

        if (task.type === 'short-answer' || task.type === 'code') {
            executeSubmit(() => tasksApi.submitTextAnswer(task.id, userAnswer), { userAnswer, userFileName: undefined });
            return;
        }

        if (task.type === 'multiple-choice') {
            executeSubmit(() => tasksApi.submitMultipleChoice(task.id, userAnswer), { userAnswer, userFileName: undefined });
            return;
        }
    };

    const saveNotes = async (content: string) => {
        // Optimistic update or just save?
        // Since it's auto-save, we just send it.
        await coursesApi.updateChapterNotes(course.bookId, course.chapterId, content);
        // We might not want to invalidate queries immediately to avoid flickering if we just typed it.
        // But for consistency we can update cache.
        // Actually, better to update the cache directly with setQueryData if we had the query key exposed here for notes.
        // Only invalidate if we want to re-fetch.
        // Let's just invalidate for now, but debounce in UI prevents high freq invalidations.
    };

    return {
        activeTab,
        setActiveTab,
        taskAnswers,
        handleTaskAnswer,
        toggleMultiSelectOption,
        handleSubmitTask,
        handleRetakeTask,
        submitting,
        saveNotes,
        openFilePicker,
        completedTasks,
        progressPercentage,
        isTaskCorrect,
        tasks
    };
}
