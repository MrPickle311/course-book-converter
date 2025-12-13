import { useState, useEffect } from 'react';
import { DefaultService } from '@/shared/api/openapi';
import type { Course, Task } from '../types';

export function useCourse(course: Course, onUpdateCourse: (course: Course) => void) {
    const [activeTab, setActiveTab] = useState('notes');
    const [taskAnswers, setTaskAnswers] = useState<Record<string, string | string[] | File | null>>({});
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
    const [editOpen, setEditOpen] = useState(false);

    // Helper logic
    const completedTasks = course.tasks.filter(task => task.completed).length;
    const progressPercentage = course.tasks.length > 0 ? (completedTasks / course.tasks.length) * 100 : 0;

    const mapEvaluation = (raw: any): Task["evaluation"] | undefined => {
        if (!raw) return undefined;
        return {
            isCorrect: Boolean(raw.isCorrect),
            mistakes: raw.mistakes || [],
            score: typeof raw.score === 'number' ? raw.score : undefined,
            explanation: raw.explanation,
        };
    };

    const isTaskCorrect = (task: Task): boolean | null => {
        if (!task.completed) return null;
        if (task.type === 'multiple-select') return task.evaluation?.isCorrect === true;
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
        if (!task.completed) return false;
        return !isTaskCorrect(task);
    };

    const computeCourseCompleted = (tasks: Task[]): boolean => {
        if (tasks.length === 0) return false;
        const allCompleted = tasks.every(t => t.completed);
        if (!allCompleted) return false;
        return !tasks.some(t => isTaskFailed(t));
    };

    // Effects
    useEffect(() => {
        (async () => {
            try {
                const res = await DefaultService.getChapterTasks({ uploadId: course.bookId, chapterId: course.chapterId });
                const items = (res as any)?.tasks || [];
                const mapped: Task[] = items.map((tw: any) => {
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
                        feedback: (st.evaluation as any)?.explanation,
                        evaluation: st.evaluation ? {
                            isCorrect: Boolean(st.evaluation.isCorrect),
                            mistakes: st.evaluation.mistakes || [],
                            score: typeof st.evaluation.score === 'number' ? st.evaluation.score : undefined,
                            explanation: (st.evaluation as any)?.explanation,
                        } : undefined,
                        completed: Boolean(st.completed),
                    } as Task;
                });
                const updatedCourse = {
                    ...course,
                    tasks: mapped,
                    completed: computeCourseCompleted(mapped)
                };
                // Only update if actually changed to avoid infinite loops if referential equality issues arose,
                // but here we trust the parent or just emit it.
                // Simple check: length or completed status or task completion count
                const prevCompleted = course.tasks.filter(t => t.completed).length;
                const newCompleted = mapped.filter(t => t.completed).length;
                if (mapped.length !== course.tasks.length || prevCompleted !== newCompleted) {
                    onUpdateCourse(updatedCourse);
                } else {
                    // Deep comparison or just force update? 
                    // Ideally we shouldn't trigger updates if data is same.
                    // But for now, let's just emit. 
                    // Actually, useEffect dependency on course.bookId/chapterId means this runs once per course change.
                    // But if onUpdateCourse changes course prop, this effect runs again? 
                    // The dependency array is [activeTab, course.bookId, course.chapterId].
                    // So it runs when activeTab or IDs change. Safe.
                    onUpdateCourse(updatedCourse);
                }

            } catch (e) {
                console.error('Failed to load tasks', e);
            }
        })();
    }, [activeTab, course.bookId, course.chapterId]);


    // Handlers
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

        // Multiple Select
        if (task.type === 'multiple-select') {
            const list = (answer as string[] | undefined) || [];
            if (list.length === 0) return;
            setSubmitting(prev => ({ ...prev, [task.id]: true }));
            (async () => {
                try {
                    const resp = await DefaultService.submitTask({
                        taskId: task.id,
                        requestBody: { type: task.type, selectedOptionIds: list } as any,
                    });
                    const updatedTask = {
                        ...task,
                        userAnswers: list,
                        evaluation: mapEvaluation(resp.evaluation),
                        completed: true,
                    } as Task;
                    const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
                    onUpdateCourse({ ...course, tasks: updatedTasks, completed: computeCourseCompleted(updatedTasks) });
                } catch (e) {
                    console.error('Submit multi-select failed', e);
                } finally {
                    setSubmitting(prev => ({ ...prev, [task.id]: false }));
                }
            })();
            return;
        }

        // Upload PDF
        if (task.type === 'upload-pdf') {
            const file = answer as File | undefined;
            if (!file) return;
            setSubmitting(prev => ({ ...prev, [task.id]: true }));
            (async () => {
                try {
                    const resp = await DefaultService.submitTaskFile({
                        taskId: task.id,
                        formData: { file }
                    });
                    const updatedTask = {
                        ...task,
                        userFileName: file.name,
                        evaluation: mapEvaluation(resp.evaluation),
                        completed: true,
                    } as Task;
                    const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
                    onUpdateCourse({ ...course, tasks: updatedTasks, completed: computeCourseCompleted(updatedTasks) });
                } catch (e) {
                    console.error('Submit upload-pdf failed', e);
                } finally {
                    setSubmitting(prev => ({ ...prev, [task.id]: false }));
                }
            })();
            return;
        }

        // Short Answer / Code / Multiple Choice
        const userAnswer = (answer as string | undefined) || '';
        if (!userAnswer) return;

        if (task.type === 'short-answer' || task.type === 'code') {
            setSubmitting(prev => ({ ...prev, [task.id]: true }));
            (async () => {
                try {
                    const resp = await DefaultService.submitTask({
                        taskId: task.id,
                        requestBody: { type: task.type, textAnswer: userAnswer } as any,
                    });
                    const updatedTask = {
                        ...task,
                        userAnswer,
                        evaluation: mapEvaluation(resp.evaluation),
                        completed: true,
                        userFileName: undefined,
                    } as Task;
                    const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
                    onUpdateCourse({ ...course, tasks: updatedTasks, completed: computeCourseCompleted(updatedTasks) });
                } catch (e) {
                    console.error('Submit short-answer failed', e);
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
                    const resp = await DefaultService.submitTask({
                        taskId: task.id,
                        requestBody: { type: task.type, selectedOptionId: userAnswer } as any,
                    });
                    const updatedTask = {
                        ...task,
                        userAnswer,
                        evaluation: mapEvaluation(resp.evaluation),
                        completed: true,
                        userFileName: undefined,
                    } as Task;
                    const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
                    onUpdateCourse({ ...course, tasks: updatedTasks, completed: computeCourseCompleted(updatedTasks) });
                } catch (e) {
                    console.error('Submit multiple-choice failed', e);
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
