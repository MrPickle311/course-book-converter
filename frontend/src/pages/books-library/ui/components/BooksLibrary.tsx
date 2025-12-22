import { Card, Empty, Flex, Input, Pagination, Progress, Tabs, Tag, theme, Typography } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReadOutlined,
  RightOutlined,
  SearchOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useLibrary } from '../hooks/useLibrary.ts';
import { useAppStyles } from '@/shared/ui/theme/AppStyles.ts';
import type { Book } from "@/entities/book";
import type { Metrics } from "@/entities/metrics";
import type { ReactNode } from "react";
import { useQuery } from '@tanstack/react-query';
import { booksApi } from '@/entities/book';
import { LoadingPage } from "@/shared/ui";
import { useNavigate } from 'react-router-dom';
import { useSettings } from "@/features/user-settings";

const { useToken } = theme;

export function BooksLibrary() {
  const { token } = useToken();
  const styles = useAppStyles(token);
  const navigate = useNavigate();
  const { pageSize: settingsPageSize } = useSettings();

  const { data, isLoading } = useQuery({
    queryKey: ['books', 1, settingsPageSize],
    queryFn: () => booksApi.getBooksList(1, settingsPageSize)
  });

  const books = data?.books || [];
  const metrics = data?.metrics || {
    total: 0,
    completed: 0,
    inProgress: 0,
    failedTasks: 0,
    overallProgressPct: 0,
    totalBooks: 0,
    completedBooks: 0,
    inProgressBooks: 0,
    totalTasks: 0,
    completedTasks: 0
  } as any as Metrics;

  const {
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
  } = useLibrary(books, [], metrics);

  if (isLoading) {
    return <LoadingPage />;
  }

  const overallProgress = stats.overallProgressPct;

  interface MetricsCardProps {
    text: string,
    statsValue: string,
    iconColor: string,
    icon?: ReactNode
    bottomWidget?: ReactNode
  }

  const MatricsCard = (props: MetricsCardProps) => {
    return (
      <Card style={{ ...styles.card, width: '19%' }} size="small" >
        <Flex align="center" justify="space-between">
          <Flex vertical gap={4}>
            <Typography.Text type="secondary">
              {props.text}
            </Typography.Text>
            <Typography.Text style={{ fontSize: '1.75rem', fontWeight: 600, color: props.iconColor }}>
              {props.statsValue}
            </Typography.Text>
          </Flex>
          {props?.icon}
        </Flex>
        {props?.bottomWidget}
      </Card>
    )
  }

  const handleOpenBook = (book: Book) => {
    navigate(`/book/${book.id}`);
  };

  function generateBookOutline(book: Book) {
    const statsForBook = bookStats.get(book.id)!;
    const progress = statsForBook.totalTasks > 0 ? (statsForBook.completedTasks / statsForBook.totalTasks) * 100 : 0;
    return (
      <Card
        key={book.id}
        hoverable
        onClick={() => handleOpenBook(book)}
        title={
          <Flex align="center" justify="space-between" gap={12}>
            <Flex align="center" gap={12}>
              <Flex
                align="center"
                justify="center"
                style={styles.iconWrapperSmall}
              >
                <ReadOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
              </Flex>
              <Flex vertical>
                <Typography.Text strong style={{ fontSize: '1.1rem' }}>{book.title}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: '0.875rem' }}>
                  {statsForBook.totalCourses} generated course{statsForBook.totalCourses !== 1 ? 's' : ''} •
                  Uploaded{' '}
                  {new Date(book.uploadDate).toLocaleDateString()}
                </Typography.Text>
              </Flex>
            </Flex>
            <Flex align="center" gap={12}>
              <Tag color={statsForBook.isCompleted ? 'success' : statsForBook.isInProgress ? 'processing' : 'default'}>
                {statsForBook.isCompleted ? 'Completed' : statsForBook.isInProgress ? 'In Progress' : 'Not Started'}
              </Tag>
              <RightOutlined style={{ fontSize: 20, color: token.colorTextQuaternary }} />
            </Flex>
          </Flex>
        }
      >
        <Flex align="center" gap={16} style={styles.textSecondary}>
          <Flex align="center" gap={6}>
            <CheckCircleOutlined style={{ fontSize: 16 }} />
            <Typography.Text type="secondary">
              {statsForBook.completedTasks}/{statsForBook.totalTasks} tasks
            </Typography.Text>
          </Flex>
          {statsForBook.failedTasks > 0 && (
            <Flex
              align="center"
              gap={6}
              style={{ color: token.colorError }}>
              <Typography.Text
                type="danger">
                • {statsForBook.failedTasks} failed
              </Typography.Text>
            </Flex>
          )}
        </Flex>
        <Progress
          percent={Math.round(progress)}
          size="small"
          status={statsForBook.failedTasks > 0 ? 'exception' : 'active'}
        />
      </Card>
    );
  }

  return (
    <Flex vertical gap={24} style={styles.pageContainer}>
      <Flex vertical gap={16}>
        <Flex align="center" justify="space-between">
          <Typography.Title level={2} style={styles.headerTitle}>
            My Books
          </Typography.Title>
        </Flex>

        <Input
          placeholder="Search books by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
          size="large"
          allowClear
        />
      </Flex>

      <Flex wrap justify="space-evenly" gap={1}>

        <MatricsCard
          statsValue={stats.total.toString()}
          text={"Total books"}
          iconColor={token.colorText}
          icon={<BookOutlined style={{ fontSize: 32, color: token.colorSuccess }} />}
        />

        <MatricsCard
          statsValue={stats.completed.toString()}
          text={"Completed"}
          iconColor={token.colorSuccess}
          icon={<CheckCircleOutlined style={{ fontSize: 32, color: token.colorSuccess }} />}
        />

        <MatricsCard
          statsValue={stats.inProgress.toString()}
          text={"In Progress"}
          iconColor={token.colorWarning}
          icon={<ClockCircleOutlined style={{ fontSize: 32, color: token.colorWarning }} />}
        />

        <MatricsCard
          statsValue={stats.failedTasks.toString()}
          text={"Failed Tasks"}
          iconColor={token.colorError}
        />

        <MatricsCard
          statsValue={Math.round(overallProgress) + '%'}
          text={"Overall Progress"}
          iconColor={token.colorText}
          icon={<TrophyOutlined style={{ fontSize: 32, color: '#a855f7' }} />}
          bottomWidget={<Progress percent={overallProgress} size="small" showInfo={false} />}
        />

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
              .slice((page - 1) * pageSize, page * pageSize)
              .map((book) => generateBookOutline(book))
            }

            {totalPages > 1 && (
              <Flex justify="center" style={{ marginTop: 16 }}>
                <Pagination
                  current={page}
                  total={filteredBooks.length}
                  pageSize={pageSize}
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


