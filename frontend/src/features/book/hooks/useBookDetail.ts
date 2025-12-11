import { useMemo, useState } from 'react';
import { DefaultService } from '@/openapi';
import type { BookDetail, Chapter } from '@/openapi';

export interface BookDetailProps {
    book: BookDetail;
    onGenerateCourse?: (chapterId: string) => Promise<void> | void;
    onOpenGeneratedCourse?: (chapterId: string) => Promise<void> | void;
    onDeleteBook?: (bookId: string) => Promise<void> | void;
}

export function useBookDetail(book: BookDetail) {
    const [generating, setGenerating] = useState<Set<string>>(new Set());

    const stats = useMemo(() => {
        const chapters: Chapter[] = book.chapters || [];
        const generated = chapters.filter((ch) => ch.isGenerated);
        const generatedChaptersCount = generated.length;
        const totalTasks = chapters.reduce((acc, ch) => acc + (ch.progressData?.tasksCount || 0), 0);
        const completedTasks = chapters.reduce((acc, ch) => acc + (ch.progressData?.tasksCompleted || 0), 0);
        const failedTasks = chapters.reduce((acc, ch) => acc + (ch.progressData?.tasksFailed || 0), 0);
        const completedCourses = generated.filter((ch) => (ch.progressData?.tasksCount || 0) > 0 && ch.progressData?.tasksCompleted === ch.progressData?.tasksCount).length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        return { generatedChaptersCount, completedCourses, totalTasks, completedTasks, failedTasks, progress };
    }, [book.id, book.chapters]);

    const handleDelete = async (onDeleteBook?: (id: string) => Promise<void> | void) => {
        try {
            if (onDeleteBook) {
                await onDeleteBook(book.id);
            } else {
                await DefaultService.deleteBook({ uploadId: book.id });
                window.location.href = '/';
            }
        } catch (e) {
            console.error('Failed to delete book', e);
        }
    };

    const handleGenerate = async (chapterId: string, onGenerateCourse?: (id: string) => Promise<void> | void) => {
        if (!onGenerateCourse) return;
        setGenerating((prev) => new Set(prev).add(chapterId));
        await onGenerateCourse(chapterId);
        setGenerating((prev) => {
            const next = new Set(prev);
            next.delete(chapterId);
            return next;
        });
    };

    return {
        stats,
        generating,
        handleDelete,
        handleGenerate
    };
}
