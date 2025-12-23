import { Suspense, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesApi } from '@/entities/course';
import type { Course } from '@/entities/course';
import { booksApi } from '@/entities/book';
import { CourseContent } from './CourseContent.tsx';
import { LoadingPage } from '@/shared/ui';
import { useAuth } from '@/shared/lib';
import { useQuery } from '@tanstack/react-query';

const ONE_HOUR = 1000 * 60 * 60;

export function CoursePage() {
    const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: book, isLoading: loadingBook } = useQuery({
        queryKey: ['book', bookId],
        queryFn: () => booksApi.getBookDetails(bookId!),
        enabled: !!bookId
    });

    const { data: notes, isLoading: loadingNotes } = useQuery({
        queryKey: ['course', bookId, chapterId, 'notes'],
        queryFn: () => coursesApi.getCourseNotes(bookId!, chapterId!),
        enabled: !!bookId && !!chapterId,
        staleTime: ONE_HOUR
    });

    const course = useMemo<Course | null>(() => {
        if (!book || !notes || !chapterId || !user) {
            return null;
        }

        const chapter = book.chapters.find(c => c.chapterId === chapterId);
        if (!chapter) {
            return null;
        }

        return {
            id: `canonical-${book.id}-${chapter.chapterId}`,
            bookId: book.id,
            bookTitle: book.title,
            chapterId: chapter.chapterId,
            chapterTitle: chapter.title,
            notes: notes,
            tasks: [],
            createdDate: new Date().toISOString().split('T')[0],
            completed: false,
            userId: user.id,
        };
    }, [book, notes, chapterId, user]);

    if (book && chapterId && !book.chapters.find(c => c.chapterId === chapterId)) {
        console.error('Chapter not found');
        navigate('/library');
        return null;
    }

    if (loadingBook || loadingNotes || !course) {
        return <LoadingPage />;
    }

    return (
        <Suspense fallback={<LoadingPage />}>
            <CourseContent
                course={course}
            />
        </Suspense>
    );
}
