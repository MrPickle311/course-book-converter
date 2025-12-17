import {useEffect, useMemo, useState} from 'react';
import {useSettings} from '@/shared/contexts/SettingsContext.tsx';
import type {Course} from '@/entities/course/model/types.ts';
import type {Book} from "@/entities/book/model/types.ts";
import type {LibraryMetricsUI} from "@/entities/metrics/model/types.tsx";

export function useLibrary(books: Book[], courses: Course[], metrics: LibraryMetricsUI) {
    const { pageSize } = useSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState<'all' | 'in-progress' | 'completed'>('all');
    const [page, setPage] = useState(1);

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
        books.forEach((book: Book) => {
            const progressData = book?.progressData;
            if (progressData) {
                const totalCoursesFromBackend = Number(book?.generatedCoursesCount || 0);
                const totalTasks = Number(progressData.tasksCount || 0);
                const completedTasks = Number(progressData.tasksCompleted || 0);
                const failedTasks = Number(progressData.tasksFailed || 0);
                const isCompleted = totalTasks > 0 && completedTasks === totalTasks && failedTasks === 0;
                const isInProgress = totalTasks > 0 && !isCompleted && (completedTasks > 0 || failedTasks > 0);
                map.set(book.id, {
                    totalCourses: totalCoursesFromBackend,
                    completedCourses: 0,
                    totalTasks,
                    completedTasks,
                    failedTasks,
                    isCompleted,
                    isInProgress
                });
                return;
            }
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
        const getLastUsed = (book: Book) => {
            const lastUsed = book.lastUsedAt;
            return typeof lastUsed === 'string' ? lastUsed : book.uploadDate;
        };
        return base.slice().sort((a, b) => {
            const aTime = Date.parse(getLastUsed(a));
            const bTime = Date.parse(getLastUsed(b));
            return bTime - aTime;
        });
    }, [books, bookStats, searchQuery, activeView]);

    const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));

    useEffect(() => {
        if (page > totalPages) {
            setPage(1);
        }
    }, [totalPages, page]);

    const stats = useMemo(() => {
            return {
                total: metrics.totalBooks,
                completed: metrics.completedBooks,
                inProgress: metrics.inProgressBooks,
                totalTasks: metrics.totalTasks,
                completedTasks: metrics.completedTasks,
                failedTasks: metrics.failedTasks,
                overallProgressPct: Math.round((metrics.overallProgressFraction || 0) * 100),
            }
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
        pageSize
    };
}
