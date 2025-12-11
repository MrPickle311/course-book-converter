import { Card, Input, Progress, Pagination, Tabs, Flex, Typography, Tag, Empty, theme } from 'antd';
import { ReadOutlined, CheckCircleOutlined, RightOutlined, SearchOutlined, TrophyOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import type { Course } from "../../features/course/types";
import type { BookDetail } from "@/openapi";
import { useLibrary } from './hooks/useLibrary';
import { getLibraryStyles } from './styles';

const { useToken } = theme;

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
  const { token } = useToken();
  const styles = getLibraryStyles(token);

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
    BOOKS_PER_PAGE
  } = useLibrary(books, courses, metrics);

  const overallProgress = stats.overallProgressPct;

  return (
    <Flex vertical gap={24} style={styles.container}>
      <Flex vertical gap={16}>
        <Flex align="center" justify="space-between">
          <Typography.Title level={2} style={styles.title}>
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

      <Flex wrap gap={16}>
        <Card style={styles.card} size="small">
          <Flex align="center" justify="space-between">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">
                Total Books
              </Typography.Text>
              <Typography.Text style={styles.statValue}>
                {stats.total}
              </Typography.Text>
            </Flex>
            <BookOutlined style={{ fontSize: 32, color: token.colorLink }} />
          </Flex>
        </Card>

        <Card style={styles.card} size="small">
          <Flex align="center" justify="space-between">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">
                Completed
              </Typography.Text>
              <Typography.Text style={{ ...styles.statValue, color: token.colorSuccess }}>
                {stats.completed}
              </Typography.Text>
            </Flex>
            <CheckCircleOutlined style={{ fontSize: 32, color: token.colorSuccess }} />
          </Flex>
        </Card>

        <Card style={styles.card} size="small">
          <Flex align="center" justify="space-between">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">
                In Progress
              </Typography.Text>
              <Typography.Text style={{ ...styles.statValue, color: token.colorWarning }}>
                {stats.inProgress}
              </Typography.Text>
            </Flex>
            <ClockCircleOutlined style={{ fontSize: 32, color: token.colorWarning }} />
          </Flex>
        </Card>

        <Card style={styles.card} size="small">
          <Flex align="center" justify="space-between">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">
                Failed Tasks
              </Typography.Text>
              <Typography.Text style={{ ...styles.statValue, color: token.colorError }}>
                {stats.failedTasks}
              </Typography.Text>
            </Flex>
          </Flex>
        </Card>

        <Card style={styles.card} size="small">
          <Flex align="center" justify="space-between">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">
                Overall Progress
              </Typography.Text>
              <Typography.Text style={styles.statValue}>
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
                            style={styles.bookCardIconWrapper}
                          >
                            <ReadOutlined style={styles.bookCardIcon} />
                          </Flex>
                          <Flex vertical>
                            <Typography.Text strong style={styles.bookCardTitle}>{book.title}</Typography.Text>
                            <Typography.Text type="secondary" style={styles.bookCardSubtitle}>
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
                          <RightOutlined style={{ fontSize: 20, color: token.colorTextQuaternary }} />
                        </Flex>
                      </Flex>
                    }
                  >
                    <Flex align="center" gap={16} style={styles.cardMeta}>
                      <Flex align="center" gap={6}>
                        <CheckCircleOutlined style={{ fontSize: 16 }} />
                        <Typography.Text type="secondary">
                          {statsForBook.completedTasks}/{statsForBook.totalTasks} tasks
                        </Typography.Text>
                      </Flex>
                      {statsForBook.failedTasks > 0 && (
                        <Flex align="center" gap={6} style={{ color: token.colorError }}>
                          <Typography.Text type="danger">• {statsForBook.failedTasks} failed</Typography.Text>
                        </Flex>
                      )}
                    </Flex>
                    <Progress percent={Math.round(progress)} size="small" status={statsForBook.failedTasks > 0 ? 'exception' : 'active'} />
                  </Card>
                );
              })}

            {totalPages > 1 && (
              <Flex justify="center" style={styles.paginationContainer}>
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


