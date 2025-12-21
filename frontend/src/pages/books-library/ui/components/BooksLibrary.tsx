import {Card, Empty, Flex, Input, Pagination, Progress, Tabs, Tag, theme, Typography} from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReadOutlined,
  RightOutlined,
  SearchOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import type {Course} from "@/entities/course/model/types.ts";
import {useLibrary} from '../hooks/useLibrary.ts';
import {getLibraryStyles} from '@/pages/books-library/ui/styles/styles.ts';
import type {Book} from "@/entities/book/model/types.ts";
import type {Metrics} from "@/entities/metrics/model/types.tsx";
import type {ReactNode} from "react";

const { useToken } = theme;

interface BooksLibraryProps {
  books: Book[];
  courses: Course[];
  onOpenBook: (book: Book) => void;
  metrics: Metrics;
}

export function BooksLibrary(props: BooksLibraryProps) {
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
    pageSize
  } = useLibrary(props.books, props.courses, props.metrics);

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
        <Card style={styles.card} size="small">
          <Flex align="center" justify="space-between">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">
                {props.text}
              </Typography.Text>
              <Typography.Text style={{ ...styles.statValue, color: props.iconColor }}>
                {props.statsValue}
              </Typography.Text>
            </Flex>
            {props?.icon}
          </Flex>
          {props?.bottomWidget}
        </Card>
    )
  }

  function generateBookOutline(book: Book) {
    const statsForBook = bookStats.get(book.id)!;
    const progress = statsForBook.totalTasks > 0 ? (statsForBook.completedTasks / statsForBook.totalTasks) * 100 : 0;
    return (
        <Card
            key={book.id}
            hoverable
            onClick={() => props.onOpenBook(book)}
            title={
              <Flex align="center" justify="space-between" gap={12}>
                <Flex align="center" gap={12}>
                  <Flex
                      align="center"
                      justify="center"
                      style={styles.bookCardIconWrapper}
                  >
                    <ReadOutlined style={styles.bookCardIcon}/>
                  </Flex>
                  <Flex vertical>
                    <Typography.Text strong style={styles.bookCardTitle}>{book.title}</Typography.Text>
                    <Typography.Text type="secondary" style={styles.bookCardSubtitle}>
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
                  <RightOutlined style={{fontSize: 20, color: token.colorTextQuaternary}}/>
                </Flex>
              </Flex>
            }
        >
          <Flex align="center" gap={16} style={styles.cardMeta}>
            <Flex align="center" gap={6}>
              <CheckCircleOutlined style={{fontSize: 16}}/>
              <Typography.Text type="secondary">
                {statsForBook.completedTasks}/{statsForBook.totalTasks} tasks
              </Typography.Text>
            </Flex>
            {statsForBook.failedTasks > 0 && (
                <Flex
                    align="center"
                    gap={6}
                    style={{color: token.colorError}}>
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
              <Flex justify="center" style={styles.paginationContainer}>
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


