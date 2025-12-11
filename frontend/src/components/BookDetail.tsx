import { useMemo, useState } from 'react';
import { Card, Button, Progress, Tag, Typography, Flex } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, RightOutlined, ReadOutlined, DeleteOutlined } from '@ant-design/icons';
import { type BookDetail, type Chapter, DefaultService } from '@/openapi';

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
      <Card
        title={
          <Flex align="center" gap={16}>
            <Flex
              align="center"
              justify="center"
              style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#eef2ff' }}
            >
              <ReadOutlined style={{ fontSize: 24, color: '#4f46e5' }} />
            </Flex>
            <Flex vertical>
              <Typography.Title level={4} style={{ margin: 0 }}>{book.title}</Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: '0.875rem' }}>
                Uploaded {new Date(book.uploadDate).toLocaleDateString()}
              </Typography.Text>
            </Flex>
          </Flex>
        }
        extra={
          <div style={{ marginLeft: 'auto' }}>
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
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
              Delete book
            </Button>
          </div>
        }
      >
        <Flex wrap gap={16} style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: '0.875rem' }}>
            Generated courses:{' '}
            <Typography.Text strong>{stats.generatedChaptersCount}</Typography.Text>
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: '0.875rem' }}>
            Completed:{' '}
            <Typography.Text strong>{stats.completedCourses}</Typography.Text>
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: '0.875rem' }}>
            Tasks:{' '}
            <Typography.Text strong>
              {stats.completedTasks}/{stats.totalTasks}
            </Typography.Text>
            {stats.failedTasks > 0 && <span style={{ color: '#dc2626' }}> • {stats.failedTasks} failed</span>}
          </Typography.Text>
        </Flex>
        <Progress percent={Math.round(stats.progress)} size="small" status="active" />
      </Card>

      <Flex vertical gap={16}>
        {book.chapters.map((chapter) => {
          if (!chapter.isGenerated) {
            const isBusy = generating.has(chapter.chapterId);
            return (
              <Card key={chapter.chapterId} size="small">
                <Flex align="center" justify="space-between">
                  <Flex vertical gap={4}>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {chapter.title}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
                      Page {chapter.startPage}
                    </Typography.Text>
                  </Flex>
                  <Button
                    size="small"
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
                    loading={isBusy}
                    disabled={isBusy}
                  >
                    {isBusy ? 'Generating…' : 'Generate course'}
                  </Button>
                </Flex>
              </Card>
            );
          }

          const tasksCount = chapter.progressData?.tasksCount || 0;
          const completedTasks = chapter.progressData?.tasksCompleted || 0;
          const progress = tasksCount > 0 ? (completedTasks / tasksCount) * 100 : 0;
          const isCourseCompleted = tasksCount > 0 && (chapter.progressData?.tasksCompleted === chapter.progressData?.tasksCount);
          return (
            <Card
              key={chapter.chapterId}
              hoverable
              onClick={() => onOpenGeneratedCourse && onOpenGeneratedCourse(chapter.chapterId)}
              bodyStyle={{ padding: 16 }}
            >
              <Flex align="center" justify="space-between">
                <Flex vertical gap={8} style={{ flex: 1 }}>
                  <Flex align="center" gap={8}>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {chapter.title}
                    </Typography.Title>
                    <Tag color={isCourseCompleted ? 'success' : 'default'} style={{ fontSize: '0.75rem' }}>
                      {isCourseCompleted ? 'Completed' : 'In Progress'}
                    </Tag>
                  </Flex>
                  <Flex align="center" gap={16} style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    <Flex align="center" gap={6}>
                      <CalendarOutlined style={{ fontSize: 12 }} />
                      <Typography.Text type="secondary">Created {new Date(book.uploadDate).toLocaleDateString()}</Typography.Text>
                    </Flex>
                    <Flex align="center" gap={6}>
                      <CheckCircleOutlined style={{ fontSize: 12 }} />
                      <Typography.Text type="secondary">
                        {completedTasks}/{tasksCount} tasks
                      </Typography.Text>
                    </Flex>
                  </Flex>
                  <Progress percent={Math.round(progress)} size="small" showInfo />
                </Flex>
                <RightOutlined style={{ fontSize: 20, color: 'rgba(0,0,0,0.25)' }} />
              </Flex>
            </Card>
          );
        })}
      </Flex>
    </Flex>
  );
}


