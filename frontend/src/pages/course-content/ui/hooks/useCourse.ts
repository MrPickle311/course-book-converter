import { useState, useEffect } from 'react';
import type { Course, Task, TaskEvaluation } from '@/entities/course/model/types.ts';
import { tasksApi } from '../../api/tasksApi.ts';

export function useCourse(course: Course, onUpdateCourse: (course: Course) => void) {
    const [activeTab, setActiveTab] = useState('notes');
    const [taskAnswers, setTaskAnswers] = useState<Record<string, string | string[] | File | null>>({});
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
    const [editOpen, setEditOpen] = useState(false);

    const completedTasks = course.tasks.filter(task => task.completed).length;
    const progressPercentage = course.tasks.length > 0 ? (completedTasks / course.tasks.length) * 100 : 0;

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

    const isTaskFailed = (task: Task): boolean => {
        if (!task.completed) {
            return false;
        }
        return !isTaskCorrect(task);
    };

    const computeCourseCompleted = (tasks: Task[]): boolean => {
        if (tasks.length === 0) {
            return false;
        }
        const allCompleted = tasks.every(t => t.completed);
        if (!allCompleted) {
            return false;
        }
        return !tasks.some(t => isTaskFailed(t));
    };

    useEffect(function updateTasks() {
        (async () => {
            try {
                const mapped = await tasksApi.getChapterTasks(course.bookId, course.chapterId);
                const updatedCourse = {
                    ...course,
                    tasks: mapped,
                    completed: computeCourseCompleted(mapped)
                };

                const prevCompleted = course.tasks.filter(t => t.completed).length;
                const newCompleted = mapped.filter(t => t.completed).length;
                if (mapped.length !== course.tasks.length || prevCompleted !== newCompleted) {
                    onUpdateCourse(updatedCourse);
                } else {
                    onUpdateCourse(updatedCourse);
                }

            } catch (e) {
                console.error('Failed to load tasks', e);
            }
        })();
    }, [activeTab, course.bookId, course.chapterId]);


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
        const updatedTasks = course.tasks.map(t => t.id === task.id ? resetTask : t);
        const updatedCourse = {
            ...course,
            tasks: updatedTasks,
            completed: computeCourseCompleted(updatedTasks)
        };
        onUpdateCourse(updatedCourse);
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
            const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
            onUpdateCourse({ ...course, tasks: updatedTasks, completed: computeCourseCompleted(updatedTasks) });
        };

        if (task.type === 'multiple-select') {
            const list = (answer as string[] | undefined) || [];
            if (list.length === 0) {
                return;
            }
            setSubmitting(prev => ({ ...prev, [task.id]: true }));
            (async () => {
                try {
                    const evaluation = await tasksApi.submitMultiSelect(task.id, list);
                    updateTaskWithResult(evaluation, { userAnswers: list });
                } catch (e) {
                    console.error('Submit failed', e);
                } finally {
                    setSubmitting(prev => ({ ...prev, [task.id]: false }));
                }
            })();
            return;
        }

        if (task.type === 'upload-pdf') {
            const file = answer as File | undefined;
            if (!file) {
                return;
            }
            setSubmitting(prev => ({ ...prev, [task.id]: true }));
            (async () => {
                try {
                    const evaluation = await tasksApi.submitPdfUpload(task.id, file);
                    updateTaskWithResult(evaluation, { userFileName: file.name });
                } catch (e) {
                    console.error('Submit failed', e);
                } finally {
                    setSubmitting(prev => ({ ...prev, [task.id]: false }));
                }
            })();
            return;
        }

        const userAnswer = (answer as string | undefined) || '';
        if (!userAnswer) {
            return;
        }

        if (task.type === 'short-answer' || task.type === 'code') {
            setSubmitting(prev => ({ ...prev, [task.id]: true }));
            (async () => {
                try {
                    const evaluation = await tasksApi.submitTextAnswer(task.id, userAnswer);
                    updateTaskWithResult(evaluation, { userAnswer, userFileName: undefined });
                } catch (e) {
                    console.error('Submit failed', e);
                } finally {
                    setSubmitting(prev => ({ ...prev, [task.id]: false }));
                }
            })();
            return;
        }

        if (task.type === 'multiple-choice') {
            setSubmitting(prev => ({ ...prev, [task.id]: true }));
            (async () => {
                try {
                    const evaluation = await tasksApi.submitMultipleChoice(task.id, userAnswer);
                    updateTaskWithResult(evaluation, { userAnswer, userFileName: undefined });
                } catch (e) {
                    console.error('Submit failed', e);
                } finally {
                    setSubmitting(prev => ({ ...prev, [task.id]: false }));
                }
            })();
            return;
        }
    };

    const handleNotesSave = (value: string) => {
        const updatedCourse = { ...course, notes: value };
        onUpdateCourse(updatedCourse);
        setEditOpen(false);
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
        editOpen,
        setEditOpen,
        handleNotesSave,
        openFilePicker,
        completedTasks,
        progressPercentage,
        isTaskCorrect
    };
}
