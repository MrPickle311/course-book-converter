import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { BookOpen, CheckCircle, ChevronRight, Search, Trophy, Clock } from 'lucide-react';
import { useSettings } from './SettingsContext';
import type {Course} from "@/components/CourseContent.tsx";
import type {BookDetail} from "@/openapi";
import { Tabs, Flex, Typography } from 'antd';

interface LibraryMetricsUI {
  totalBooks: number;
  completedBooks: number;
  inProgressBooks: number;
  failedTasks: number;
  totalTasks: number;
  completedTasks: number;
  overallProgress: number; // 0..1
}

interface BooksLibraryProps {
  books: BookDetail[];
  courses: Course[];
  onOpenBook: (book: BookDetail) => void;
  metrics?: LibraryMetricsUI;
}

export function BooksLibrary({ books, courses, onOpenBook, metrics }: BooksLibraryProps) {
  const { pageSize } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'all' | 'in-progress' | 'completed'>('all');

  const bookStats = useMemo(() => {
    const map = new Map<string, {
      totalCourses: number; // unique generated chapters
      completedCourses: number; // representative completed courses
      totalTasks: number; // tasks across unique representatives
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
    // sort by lastUsedAt desc, fallback to uploadDate desc
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

  const overallProgress = stats.overallProgressPct;

  return (
    <Flex vertical gap={24} style={{ maxWidth: '72rem', margin: '0 auto' }}>
      <Flex vertical gap={16}>
        <Flex align="center" justify="space-between">
          <Typography.Title level={2} style={{ margin: 0 }}>
            My Books
          </Typography.Title>
        </Flex>

        <div style={{ position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 16,
              height: 16,
              color: 'var(--muted-foreground)',
            }}
          />
          <Input
            placeholder="Search books by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>
      </Flex>

      <Flex wrap gap={16}>
        <Card style={{ flex: '1 1 200px' }}>
          <CardContent style={{ padding: 16 }}>
            <Flex align="center" justify="space-between">
              <Flex vertical gap={4}>
                <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  Total Books
                </Typography.Text>
                <Typography.Text style={{ fontSize: '1.75rem', fontWeight: 600 }}>
                  {stats.total}
                </Typography.Text>
              </Flex>
              <BookOpen style={{ width: 32, height: 32, color: '#3b82f6' }} />
            </Flex>
          </CardContent>
        </Card>

        <Card style={{ flex: '1 1 200px' }}>
          <CardContent style={{ padding: 16 }}>
            <Flex align="center" justify="space-between">
              <Flex vertical gap={4}>
                <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  Completed
                </Typography.Text>
                <Typography.Text style={{ fontSize: '1.75rem', fontWeight: 600, color: '#16a34a' }}>
                  {stats.completed}
                </Typography.Text>
              </Flex>
              <CheckCircle style={{ width: 32, height: 32, color: '#16a34a' }} />
            </Flex>
          </CardContent>
        </Card>

        <Card style={{ flex: '1 1 200px' }}>
          <CardContent style={{ padding: 16 }}>
            <Flex align="center" justify="space-between">
              <Flex vertical gap={4}>
                <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  In Progress
                </Typography.Text>
                <Typography.Text style={{ fontSize: '1.75rem', fontWeight: 600, color: '#f97316' }}>
                  {stats.inProgress}
                </Typography.Text>
              </Flex>
              <Clock style={{ width: 32, height: 32, color: '#f97316' }} />
            </Flex>
          </CardContent>
        </Card>

        <Card style={{ flex: '1 1 200px' }}>
          <CardContent style={{ padding: 16 }}>
            <Flex align="center" justify="space-between">
              <Flex vertical gap={4}>
                <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  Failed Tasks
                </Typography.Text>
                <Typography.Text style={{ fontSize: '1.75rem', fontWeight: 600, color: '#dc2626' }}>
                  {stats.failedTasks}
                </Typography.Text>
              </Flex>
            </Flex>
          </CardContent>
        </Card>

        <Card style={{ flex: '1 1 200px' }}>
          <CardContent style={{ padding: 16 }}>
            <Flex align="center" justify="space-between">
              <Flex vertical gap={4}>
                <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  Overall Progress
                </Typography.Text>
                <Typography.Text style={{ fontSize: '1.75rem', fontWeight: 600 }}>
                  {Math.round(overallProgress)}%
                </Typography.Text>
              </Flex>
              <Trophy style={{ width: 32, height: 32, color: '#a855f7' }} />
            </Flex>
            <Progress value={overallProgress} style={{ marginTop: 8 }} />
          </CardContent>
        </Card>
      </Flex>

      <Tabs
        className="bcc-tabs bcc-tabs--pill"
        activeKey={activeView}
        onChange={(key) => setActiveView(key as 'all' | 'in-progress' | 'completed')}
        items={[
          { key: 'all', label: `All Books (${stats.total})` },
          { key: 'in-progress', label: `In Progress (${stats.inProgress})` },
          { key: 'completed', label: `Completed (${stats.completed})` },
        ]}
      />

      <Flex vertical gap={24} style={{ marginTop: 24 }}>
        {filteredBooks.length === 0 ? (
          <Card>
            <CardContent style={{ padding: 48, textAlign: 'center' }}>
              <BookOpen style={{ width: 64, height: 64, color: 'var(--muted-foreground)', marginBottom: 16 }} />
              <Typography.Title level={3}>No books found</Typography.Title>
              <Typography.Text style={{ color: 'var(--muted-foreground)' }}>
                {searchQuery
                  ? 'No books match your search criteria.'
                  : 'Start by uploading a PDF book to create your first course.'}
              </Typography.Text>
            </CardContent>
          </Card>
        ) : (
          <Flex vertical gap={24}>
            {filteredBooks
              .slice((page - 1) * BOOKS_PER_PAGE, page * BOOKS_PER_PAGE)
              .map((book) => {
                const statsForBook = bookStats.get(book.id)!;
                const progress = statsForBook.totalTasks > 0 ? (statsForBook.completedTasks / statsForBook.totalTasks) * 100 : 0;
                return (
                  <Card
                    key={book.id}
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--card)')}
                    onClick={() => onOpenBook(book)}
                  >
                    <CardHeader>
                      <Flex align="center" justify="space-between" gap={12}>
                        <Flex align="center" gap={12}>
                          <Flex
                            align="center"
                            justify="center"
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              backgroundColor: '#eef2ff',
                            }}
                          >
                            <BookOpen style={{ width: 20, height: 20, color: '#4f46e5' }} />
                          </Flex>
                          <Flex vertical>
                            <CardTitle style={{ fontSize: '1.1rem' }}>{book.title}</CardTitle>
                            <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                              {statsForBook.totalCourses} generated course{statsForBook.totalCourses !== 1 ? 's' : ''} • Uploaded{' '}
                              {new Date(book.uploadDate).toLocaleDateString()}
                            </Typography.Text>
                          </Flex>
                        </Flex>
                        <Flex align="center" gap={12}>
                          <Badge
                            variant={statsForBook.isCompleted ? 'default' : statsForBook.isInProgress ? 'secondary' : 'outline'}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {statsForBook.isCompleted ? 'Completed' : statsForBook.isInProgress ? 'In Progress' : 'Not Started'}
                          </Badge>
                          <ChevronRight style={{ width: 20, height: 20, color: 'var(--muted-foreground)' }} />
                        </Flex>
                      </Flex>
                    </CardHeader>
                    <CardContent>
                      <Flex align="center" gap={16} style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: 8 }}>
                        <Flex align="center" gap={6}>
                          <CheckCircle style={{ width: 16, height: 16 }} />
                          <span>
                            {statsForBook.completedTasks}/{statsForBook.totalTasks} tasks
                          </span>
                        </Flex>
                        {statsForBook.failedTasks > 0 && (
                          <Flex align="center" gap={6} style={{ color: '#dc2626' }}>
                            <span>• {statsForBook.failedTasks} failed</span>
                          </Flex>
                        )}
                      </Flex>
                      <Progress value={progress} style={{ height: 8 }} showInfo />
                    </CardContent>
                  </Card>
                );
              })}

            {totalPages > 1 && (
              <Pagination style={{ marginTop: 16 }}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      size="default"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(1, p - 1));
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <PaginationItem key={idx}>
                      <PaginationLink
                        href="#"
                        size="default"
                        isActive={page === idx + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(idx + 1);
                        }}
                      >
                        {idx + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      size="default"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(totalPages, p + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}


