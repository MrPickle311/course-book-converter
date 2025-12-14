import { useMemo, useState, useEffect } from 'react';
import { useSettings } from '../../../../shared/contexts/SettingsContext.tsx';
import type { Course } from '../../../../entities/course/model/types.ts';
import type { BookDetail } from '@/shared/api/openapi';

interface LibraryMetricsUI {
    totalBooks: number;
    completedBooks: number;
    inProgressBooks: number;
    failedTasks: number;
    totalTasks: number;
    completedTasks: number;
    overallProgress: number; // 0..1
}

export function useLibrary(books: BookDetail[], courses: Course[], metrics?: LibraryMetricsUI) {
    const { pageSize } = useSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState<'all' | 'in-progress' | 'completed'>('all');

    const bookStats = useMemo(() => {
        const map = new Map<string, {
            totalCourses: number;
            completedCourses: number;
            totalTasks: number;
            completedTasks: number;
            failedTasks: number;
            isCompleted: boolean;
            isInProgress: boolean;
        }>();
        books.forEach((book) => {
            // Prefer backend-provided summary progress if present on the item
            const pd = (book as any)?.progressData as { tasksCount?: number; tasksCompleted?: number; tasksFailed?: number } | undefined;
            if (pd && typeof pd.tasksCount === 'number') {
                const totalCoursesFromBackend = Number(((book as any)?.generatedCoursesCount) || 0);
                const totalTasks = Number(pd.tasksCount || 0);
                const completedTasks = Number(pd.tasksCompleted || 0);
                const failedTasks = Number(pd.tasksFailed || 0);
                const isCompleted = totalTasks > 0 && completedTasks === totalTasks && failedTasks === 0;
                const isInProgress = totalTasks > 0 && !isCompleted && (completedTasks > 0 || failedTasks > 0);
                map.set(book.id, { totalCourses: totalCoursesFromBackend, completedCourses: 0, totalTasks, completedTasks, failedTasks, isCompleted, isInProgress });
                return;
            }

            // Fallback: approximate from in-memory courses
            const bookCourses = courses.filter((c) => c.bookId === book.id);
            const groups = new Map<string, typeof bookCourses>();
            bookCourses.forEach((c) => {
                const baseId = c.chapterId.split('-p')[0];
                const list = groups.get(baseId) || [];
                list.push(c);
                groups.set(baseId, list);
            });
            const representatives = Array.from(groups.values()).map((list) => list[0]);
            const totalCourses = representatives.length;
            const completedCourses = representatives.filter((c) => c.completed).length;
            const totalTasks = representatives.reduce((acc, c) => acc + c.tasks.length, 0);
            const completedTasks = representatives.reduce((acc, c) => acc + c.tasks.filter((t: any) => t.completed).length, 0);
            const failedTasks = representatives.reduce((acc, c) => acc + c.tasks.filter((t: any) => t.completed && t.evaluation?.isCorrect === false).length, 0);
            const isCompleted = totalCourses > 0 && totalTasks > 0 && completedTasks === totalTasks && failedTasks === 0;
            const isInProgress = totalCourses > 0 && ((completedTasks > 0 && completedTasks < totalTasks) || failedTasks > 0);
            map.set(book.id, { totalCourses, completedCourses, totalTasks, completedTasks, failedTasks, isCompleted, isInProgress });
        });
        return map;
    }, [books, courses]);

    const filteredBooks = useMemo(() => {
        const q = searchQuery.toLowerCase();
        const base = books.filter((b) => {
            const stats = bookStats.get(b.id);
            const matches = b.title.toLowerCase().includes(q);
            if (activeView === 'completed') {
                return matches && !!stats?.isCompleted;
            }
            if (activeView === 'in-progress') {
                return matches && !!stats?.isInProgress;
            }
            return matches;
        });
        const getLastUsed = (book: BookDetail) => {
            const lastUsed = (book as any)?.lastUsedAt;
            return typeof lastUsed === 'string' ? lastUsed : book.uploadDate;
        };
        return base.slice().sort((a, b) => {
            const aTime = Date.parse(getLastUsed(a));
            const bTime = Date.parse(getLastUsed(b));
            return bTime - aTime;
        });
    }, [books, bookStats, searchQuery, activeView]);

    const BOOKS_PER_PAGE = pageSize;
    const totalPages = Math.max(1, Math.ceil(filteredBooks.length / BOOKS_PER_PAGE));
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (page > totalPages) setPage(1);
    }, [totalPages, page]);

    const stats = useMemo(() => {
        if (metrics) {
            return {
                total: metrics.totalBooks,
                completed: metrics.completedBooks,
                inProgress: metrics.inProgressBooks,
                totalTasks: metrics.totalTasks,
                completedTasks: metrics.completedTasks,
                failedTasks: metrics.failedTasks,
                overallProgressPct: Math.round((metrics.overallProgress || 0) * 100),
            };
        }
        const total = filteredBooks.length;
        const completed = filteredBooks.filter((b) => bookStats.get(b.id)?.isCompleted).length;
        const inProgress = filteredBooks.filter((b) => bookStats.get(b.id)?.isInProgress).length;
        const totalTasks = courses.reduce((acc, c) => acc + c.tasks.length, 0);
        const completedTasks = courses.reduce((acc, c) => acc + c.tasks.filter((t: any) => t.completed).length, 0);
        const failedTasks = courses.reduce((acc, c) => acc + c.tasks.filter((t: any) => t.completed && t.evaluation?.isCorrect === false).length, 0);
        const overall = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return { total, completed, inProgress, totalTasks, completedTasks, failedTasks, overallProgressPct: overall };
    }, [metrics, filteredBooks, bookStats, courses]);

    return {
        searchQuery,
        setSearchQuery,
        activeView,
        setActiveView,
        filteredBooks,
        bookStats,
        stats,
        page,
        setPage,
        totalPages,
        BOOKS_PER_PAGE
    };
}
