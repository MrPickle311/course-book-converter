import { Card, Button, Progress, Tag, Typography, Flex, theme } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, RightOutlined, ReadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { BookDetail } from '@/shared/api/openapi';
import { useBookDetail, type BookDetailProps } from '../hooks/useBookDetail.ts';
import { getBookDetailStyles } from '../styles/styles.ts';

const { useToken } = theme;

export function BookDetail({ book, onGenerateCourse, onOpenGeneratedCourse, onDeleteBook }: BookDetailProps) {
  const { token } = useToken();
  const styles = getBookDetailStyles(token);

  const {
    stats,
    generating,
    handleDelete,
    handleGenerate
  } = useBookDetail(book);

  return (
    <Flex vertical gap={24} style={styles.container}>
      <Card
        title={
          <Flex align="center" gap={16}>
            <Flex
              align="center"
              justify="center"
              style={styles.headerIconWrapper}
            >
              <ReadOutlined style={styles.headerIcon} />
            </Flex>
            <Flex vertical>
              <Typography.Title level={4} style={styles.headerTitle}>{book.title}</Typography.Title>
              <Typography.Text type="secondary" style={styles.headerDate}>
                Uploaded {new Date(book.uploadDate).toLocaleDateString()}
              </Typography.Text>
            </Flex>
          </Flex>
        }
        extra={
          <div style={styles.deleteButtonContainer}>
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(onDeleteBook)}
            >
              Delete book
            </Button>
          </div>
        }
      >
        <Flex wrap gap={16} style={styles.statsContainer}>
          <Typography.Text type="secondary" style={styles.statLabel}>
            Generated courses:{' '}
            <Typography.Text strong>{stats.generatedChaptersCount}</Typography.Text>
          </Typography.Text>
          <Typography.Text type="secondary" style={styles.statLabel}>
            Completed:{' '}
            <Typography.Text strong>{stats.completedCourses}</Typography.Text>
          </Typography.Text>
          <Typography.Text type="secondary" style={styles.statLabel}>
            Tasks:{' '}
            <Typography.Text strong>
              {stats.completedTasks}/{stats.totalTasks}
            </Typography.Text>
            {stats.failedTasks > 0 && <span style={styles.failedText}> • {stats.failedTasks} failed</span>}
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
                    <Typography.Title level={5} style={styles.chapterTitle}>
                      {chapter.title}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={styles.chapterPage}>
                      Page {chapter.startPage}
                    </Typography.Text>
                  </Flex>
                  <Button
                    size="small"
                    onClick={() => handleGenerate(chapter.chapterId, onGenerateCourse)}
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
                    <Typography.Title level={5} style={styles.chapterTitle}>
                      {chapter.title}
                    </Typography.Title>
                    <Tag color={isCourseCompleted ? 'success' : 'default'} style={{ fontSize: '0.75rem' }}>
                      {isCourseCompleted ? 'Completed' : 'In Progress'}
                    </Tag>
                  </Flex>
                  <Flex align="center" gap={16} style={styles.chapterMeta}>
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
                <RightOutlined style={{ fontSize: 20, color: token.colorTextQuaternary }} />
              </Flex>
            </Card>
          );
        })}
      </Flex>
    </Flex>
  );
}


