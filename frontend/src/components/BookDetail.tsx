import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar, CheckCircle, ChevronRight, BookOpen, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { type BookDetail, type Chapter, DefaultService } from '@/openapi';
import { Flex, Typography } from 'antd';

export interface BookDetailProps {
  book: BookDetail;
  onGenerateCourse?: (chapterId: string) => Promise<void> | void;
  onOpenGeneratedCourse?: (chapterId: string) => Promise<void> | void;
  onDeleteBook?: (bookId: string) => Promise<void> | void;
}

export function BookDetail({ book, onGenerateCourse, onOpenGeneratedCourse, onDeleteBook }: BookDetailProps) {
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

  const [generating, setGenerating] = useState<Set<string>>(new Set());

  return (
    <Flex vertical gap={24} style={{ maxWidth: '72rem', margin: '0 auto' }}>
      <Card>
        <CardHeader>
          <Flex align="center" gap={16}>
            <Flex
              align="center"
              justify="center"
              style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#eef2ff' }}
            >
              <BookOpen style={{ width: 24, height: 24, color: '#4f46e5' }} />
            </Flex>
            <Flex vertical>
              <CardTitle style={{ fontSize: '1.5rem' }}>{book.title}</CardTitle>
              <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Uploaded {new Date(book.uploadDate).toLocaleDateString()}
              </Typography.Text>
            </Flex>
            <div style={{ marginLeft: 'auto' }}>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
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
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete book
              </Button>
            </div>
          </Flex>
        </CardHeader>
        <CardContent>
          <Flex wrap gap={16} style={{ marginBottom: 16 }}>
            <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Generated courses:{' '}
              <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{stats.generatedChaptersCount}</span>
            </Typography.Text>
            <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Completed:{' '}
              <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{stats.completedCourses}</span>
            </Typography.Text>
            <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              Tasks:{' '}
              <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>
                {stats.completedTasks}/{stats.totalTasks}
              </span>
              {stats.failedTasks > 0 && <span style={{ color: '#dc2626' }}> • {stats.failedTasks} failed</span>}
            </Typography.Text>
          </Flex>
          <Progress value={stats.progress} style={{ height: 8 }} showInfo />
        </CardContent>
      </Card>

      <Flex vertical gap={16}>
        {book.chapters.map((chapter) => {
          if (!chapter.isGenerated) {
            const isBusy = generating.has(chapter.chapterId);
            return (
              <Card key={chapter.chapterId}>
                <CardContent style={{ padding: 16 }}>
                  <Flex align="center" justify="space-between">
                    <Flex vertical gap={4}>
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        {chapter.title}
                      </Typography.Title>
                      <Typography.Text style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        Page {chapter.startPage}
                      </Typography.Text>
                    </Flex>
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!onGenerateCourse || isBusy) {
                          return;
                        }
                        setGenerating((prev) => new Set(prev).add(chapter.chapterId));
                        await onGenerateCourse(chapter.chapterId);
                        setGenerating((prev) => {
                          const next = new Set(prev);
                          next.delete(chapter.chapterId);
                          return next;
                        });
                      }}
                      disabled={isBusy}
                    >
                      {isBusy ? 'Generating…' : 'Generate course'}
                    </Button>
                  </Flex>
                </CardContent>
              </Card>
            );
          }

            const tasksCount = chapter.progressData?.tasksCount || 0;
            const completedTasks = chapter.progressData?.tasksCompleted || 0;
            const progress = tasksCount > 0 ? (completedTasks / tasksCount) * 100 : 0;
            const isCourseCompleted = tasksCount > 0 && (chapter.progressData?.tasksCompleted === chapter.progressData?.tasksCount);
            return (
              <Flex
                key={chapter.chapterId}
                align="center"
                justify="space-between"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onClick={() => onOpenGeneratedCourse && onOpenGeneratedCourse(chapter.chapterId)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--card)')}
              >
                <Flex vertical gap={8} style={{ flex: 1 }}>
                  <Flex align="center" gap={8}>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {chapter.title}
                    </Typography.Title>
                    <Badge variant={isCourseCompleted ? 'default' : 'secondary'} style={{ fontSize: '0.75rem' }}>
                      {isCourseCompleted ? 'Completed' : 'In Progress'}
                    </Badge>
                  </Flex>
                  <Flex align="center" gap={16} style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    <Flex align="center" gap={6}>
                      <Calendar style={{ width: 12, height: 12 }} />
                      <span>Created {new Date(book.uploadDate).toLocaleDateString()}</span>
                    </Flex>
                    <Flex align="center" gap={6}>
                      <CheckCircle style={{ width: 12, height: 12 }} />
                      <span>
                        {completedTasks}/{tasksCount} tasks
                      </span>
                    </Flex>
                  </Flex>
                  <Progress value={progress} style={{ height: 8 }} showInfo />
                </Flex>
                <ChevronRight style={{ width: 20, height: 20, color: 'var(--muted-foreground)' }} />
              </Flex>
            );
        })}
      </Flex>
    </Flex>
  );
}


