import { Button, Card, Flex, Progress, Tag, theme, Typography, Spin } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, DeleteOutlined, ReadOutlined, RightOutlined, LoadingOutlined } from '@ant-design/icons';
import { useBookDetail } from '../hooks/useBookDetail.ts';
import { useAppStyles } from '@/shared/ui/theme/AppStyles.ts';
import type { Chapter, Book } from "@/entities/book";
import { type ReactNode } from "react";
import { LoadingPage } from "@/shared/ui";
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { booksApi } from '@/entities/book';
import { coursesApi } from '@/entities/course';

const { useToken } = theme;
const Text = Typography.Text;

export function BookDetail() {
  const { id } = useParams<'id'>();
  const navigate = useNavigate();
  const { token } = useToken();
  const styles = useAppStyles(token);
  const queryClient = useQueryClient();

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: () => booksApi.getBookDetails(id!),
    enabled: !!id,
    staleTime: Infinity
  });

  const {
    stats,
    generating,
    handleDelete,
    handleGenerate
  } = useBookDetail(book || {} as Book);

  if (isLoading || !book) {
    return <LoadingPage />;
  }

  const onGenerateCourse = async (chapterId: string) => {
    await coursesApi.generateCourse(chapterId, book.id);
    await queryClient.invalidateQueries({ queryKey: ['book', id] });
  };

  const onDeleteBook = async (bookId: string) => {
    await booksApi.deleteBook({ id: bookId } as Book);
    await queryClient.invalidateQueries({ queryKey: ['books'] });
    navigate('/library');
  };

  const BookDetailsHeader = () =>
    <Card
      title={<Flex align="center" gap={16}>
        <Flex
          align="center"
          justify="center"
          style={styles.iconWrapper}
        >
          <ReadOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
        </Flex>
        <Flex vertical>
          <Typography.Title level={4} style={styles.sectionTitle}>{book.title}</Typography.Title>
          <Text type="secondary" style={styles.textSecondary}>
            Uploaded {new Date(book.uploadDate).toLocaleDateString()}
          </Text>
        </Flex>
      </Flex>}
      extra={<div style={{ marginLeft: 'auto' }}>
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(onDeleteBook)}
        >
          Delete book
        </Button>
      </div>}
    >
      <Flex wrap gap={16} style={{ marginBottom: 16 }}>
        <Text type="secondary" style={styles.textSecondary}>
          Generated courses:{' '}
          <Text strong>{stats.generatedChaptersCount}</Text>
        </Text>
        <Text type="secondary" style={styles.textSecondary}>
          Completed:{' '}
          <Text strong>{stats.completedCourses}</Text>
        </Text>
        <Text type="secondary" style={styles.textSecondary}>
          Tasks:{' '}
          <Text strong>
            {stats.completedTasks}/{stats.totalTasks}
          </Text>
          {stats.failedTasks > 0 && <span style={{ color: token.colorError }}> • {stats.failedTasks} failed</span>}
        </Text>
      </Flex>
      <Progress percent={Math.round(stats.progress)} size="small" status="active" />
    </Card>;

  function renderGeneratedChapter(chapter: Chapter, isCourseCompleted: boolean, completedTasks: number, tasksCount: number, progress: number) {
    return (
      <Card
        key={chapter.chapterId}
        hoverable
        onClick={() => navigate(`/course/${book!.id}/${chapter.chapterId}`)}
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
            <Flex align="center" gap={16} style={styles.textSecondary}>
              <Flex align="center" gap={6}>
                <CalendarOutlined style={{ fontSize: 12 }} />
                <Text
                  type="secondary">Created {new Date(book?.uploadDate || new Date()).toLocaleDateString()}</Text>
              </Flex>
              <Flex align="center" gap={6}>
                <CheckCircleOutlined style={{ fontSize: 12 }} />
                <Text type="secondary">
                  {completedTasks}/{tasksCount} tasks
                </Text>
              </Flex>
            </Flex>
            <Progress percent={Math.round(progress)} size="small" showInfo />
          </Flex>
          <RightOutlined style={{ fontSize: 20, color: token.colorTextQuaternary }} />
        </Flex>
      </Card>
    );
  }

  function renderNotGeneratedChapter(chapter: Chapter, isBusy: boolean) {
    return (
      <Card key={chapter.chapterId} size="small">
        <Flex align="center" justify="space-between">
          <Flex vertical gap={4}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {chapter.title}
            </Typography.Title>
            <Text type="secondary" style={{ fontSize: '0.75rem', color: token.colorTextSecondary }}>
              Page {chapter.startPage}
            </Text>
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

  const renderGeneratingChapter = (chapter: Chapter) => {
    return (
        <Card
            key={chapter.chapterId}
            title={chapter.title}
        >
          <Flex align="center" justify="flex-start" gap={12}>
            Generating
            <Spin indicator={<LoadingOutlined spin/>} size="large"/>
          </Flex>
        </Card>
    )
  }

  function renderChapter(chapter: Chapter): ReactNode {
    const isGenerating = chapter.status === 'GENERATING' || generating.has(chapter.chapterId);

    if (isGenerating) {
      return renderGeneratingChapter(chapter);
    }

    if (!chapter.isGenerated && chapter.status !== 'GENERATED') {
      const isBusy = generating.has(chapter.chapterId);
      return renderNotGeneratedChapter(chapter, isBusy);
    }

    const tasksCount = chapter.progressData?.tasksCount || 0;
    const completedTasks = chapter.progressData?.tasksCompleted || 0;
    const progress = tasksCount > 0 ? (completedTasks / tasksCount) * 100 : 0;
    const isCourseCompleted = tasksCount > 0 && (chapter.progressData?.tasksCompleted === chapter.progressData?.tasksCount);
    return renderGeneratedChapter(chapter, isCourseCompleted, completedTasks, tasksCount, progress);
  }

  return (
    <Flex vertical gap={24} style={styles.pageContainer}>
      <BookDetailsHeader />
      <Flex vertical gap={16}>
        {book.chapters?.map(c => renderChapter(c))}
      </Flex>
    </Flex>
  );
}
