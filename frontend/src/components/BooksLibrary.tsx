import { useMemo, useEffect, useState } from 'react';
import { Card, Input, Progress, Pagination, Tabs, Flex, Typography, Tag, Empty } from 'antd';
import { ReadOutlined, CheckCircleOutlined, RightOutlined, SearchOutlined, TrophyOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import { useSettings } from './SettingsContext';
import type { Course } from "@/components/CourseContent.tsx";
import type { BookDetail } from "@/openapi";

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

        <Input
          placeholder="Search books by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
          size="large"
          allowClear
        />
      </Flex>

      <Flex wrap gap={16}>
        <Card style={{ flex: '1 1 200px' }} size="small">
          <Flex align="center" justify="space-between">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">
                Total Books
              </Typography.Text>
              <Typography.Text style={{ fontSize: '1.75rem', fontWeight: 600 }}>
                {stats.total}
              </Typography.Text>
            </Flex>
            <BookOutlined style={{ fontSize: 32, color: '#3b82f6' }} />
          </Flex>
        </Card>

        <Card style={{ flex: '1 1 200px' }} size="small">
          <Flex align="center" justify="space-between">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">
                Completed
              </Typography.Text>
              <Typography.Text style={{ fontSize: '1.75rem', fontWeight: 600, color: '#16a34a' }}>
                {stats.completed}
              </Typography.Text>
            </Flex>
            <CheckCircleOutlined style={{ fontSize: 32, color: '#16a34a' }} />
          </Flex>
        </Card>

        <Card style={{ flex: '1 1 200px' }} size="small">
          <Flex align="center" justify="space-between">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">
                In Progress
              </Typography.Text>
              <Typography.Text style={{ fontSize: '1.75rem', fontWeight: 600, color: '#f97316' }}>
                {stats.inProgress}
              </Typography.Text>
            </Flex>
            <ClockCircleOutlined style={{ fontSize: 32, color: '#f97316' }} />
          </Flex>
        </Card>

        <Card style={{ flex: '1 1 200px' }} size="small">
          <Flex align="center" justify="space-between">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">
                Failed Tasks
              </Typography.Text>
              <Typography.Text style={{ fontSize: '1.75rem', fontWeight: 600, color: '#dc2626' }}>
                {stats.failedTasks}
              </Typography.Text>
            </Flex>
          </Flex>
        </Card>

        <Card style={{ flex: '1 1 200px' }} size="small">
          <Flex align="center" justify="space-between">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">
                Overall Progress
              </Typography.Text>
              <Typography.Text style={{ fontSize: '1.75rem', fontWeight: 600 }}>
                {Math.round(overallProgress)}%
              </Typography.Text>
            </Flex>
            <TrophyOutlined style={{ fontSize: 32, color: '#a855f7' }} />
          </Flex>
          <Progress percent={overallProgress} size="small" showInfo={false} />
        </Card>
      </Flex>

      <Tabs
        type="card"
        activeKey={activeView}
        onChange={(key) => setActiveView(key as 'all' | 'in-progress' | 'completed')}
        items={[
          { key: 'all', label: `All Books (${stats.total})` },
          { key: 'in-progress', label: `In Progress (${stats.inProgress})` },
          { key: 'completed', label: `Completed (${stats.completed})` },
        ]}
      />

      <Flex vertical gap={24}>
        {filteredBooks.length === 0 ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Typography.Text type="secondary">
                  {searchQuery
                    ? 'No books match your search criteria.'
                    : 'Start by uploading a PDF book to create your first course.'}
                </Typography.Text>
              }
            />
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
                    hoverable
                    onClick={() => onOpenBook(book)}
                    title={
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
                            <ReadOutlined style={{ fontSize: 20, color: '#4f46e5' }} />
                          </Flex>
                          <Flex vertical>
                            <Typography.Text strong style={{ fontSize: '1.1rem' }}>{book.title}</Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: '0.875rem' }}>
                              {statsForBook.totalCourses} generated course{statsForBook.totalCourses !== 1 ? 's' : ''} • Uploaded{' '}
                              {new Date(book.uploadDate).toLocaleDateString()}
                            </Typography.Text>
                          </Flex>
                        </Flex>
                        <Flex align="center" gap={12}>
                          <Tag
                            color={statsForBook.isCompleted ? 'success' : statsForBook.isInProgress ? 'processing' : 'default'}
                          >
                            {statsForBook.isCompleted ? 'Completed' : statsForBook.isInProgress ? 'In Progress' : 'Not Started'}
                          </Tag>
                          <RightOutlined style={{ fontSize: 20, color: 'rgba(0,0,0,0.25)' }} />
                        </Flex>
                      </Flex>
                    }
                  >
                    <Flex align="center" gap={16} style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: 8 }}>
                      <Flex align="center" gap={6}>
                        <CheckCircleOutlined style={{ fontSize: 16 }} />
                        <Typography.Text type="secondary">
                          {statsForBook.completedTasks}/{statsForBook.totalTasks} tasks
                        </Typography.Text>
                      </Flex>
                      {statsForBook.failedTasks > 0 && (
                        <Flex align="center" gap={6} style={{ color: '#dc2626' }}>
                          <Typography.Text type="danger">• {statsForBook.failedTasks} failed</Typography.Text>
                        </Flex>
                      )}
                    </Flex>
                    <Progress percent={Math.round(progress)} size="small" status={statsForBook.failedTasks > 0 ? 'exception' : 'active'} />
                  </Card>
                );
              })}

            {totalPages > 1 && (
              <Flex justify="center" style={{ marginTop: 16 }}>
                <Pagination
                  current={page}
                  total={filteredBooks.length}
                  pageSize={BOOKS_PER_PAGE}
                  onChange={(p) => setPage(p)}
                  showSizeChanger={false}
                />
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}


