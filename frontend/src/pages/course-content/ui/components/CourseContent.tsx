import {Button, Card, Flex, Popconfirm, Progress, Tabs, Tag, theme, Typography} from 'antd';
import {
    BookOutlined,
    BorderOutlined,
    CheckCircleOutlined,
    CheckSquareOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    LoadingOutlined,
    TrophyOutlined
} from '@ant-design/icons';
import {type Course, type Task} from "@/entities/course";
import {useCourse} from '../hooks/useCourse.ts';
import {useAppStyles} from '@/shared/ui/theme/AppStyles.ts';
import {TaskItem} from "./Task.tsx";
import {RichTextEditor} from "@/pages/course-content/ui/components/RichTextEditor.tsx";

export interface CourseContentProps {
  course: Course;
}

export function CourseContent(props: CourseContentProps) {
  const { token } = theme.useToken();
  const styles = useAppStyles(token);

  const {
    activeTab,
    setActiveTab,
    taskAnswers,
    handleTaskAnswer,
    handleSubmitTask,
    handleRetakeTask,
    handleDeleteCourse,
    submitting,
    saveNotes,
    completedTasks,
    progressPercentage,
    isTaskCorrect,
    tasks
  } = useCourse(props.course);

  function isSubmitButtonDisabled(task: Task): boolean | undefined {
    if (task.type === 'multiple-choice' || task.type === 'short-answer' || task.type === 'code') {
      return !taskAnswers[task.id];
    }

    if (task.type === 'multiple-select') {
      return ((taskAnswers[task.id] as string[] | undefined)?.length || 0) === 0;
    }

    if (task.type === 'upload-pdf') {
      return !taskAnswers[task.id];
    }

    return true;
  }

  const CourseHeader = () => (
    <Card>
      <Flex justify="space-between" align="flex-start">
        <Flex vertical gap={8}>
          <Flex
            align="center"
            gap={8}
            style={styles.textSecondary}
          >
            <BookOutlined style={{ width: 16, height: 16 }} />
            <span>{props.course.bookTitle}</span>
          </Flex>
          <Typography.Title level={3} style={styles.headerTitle}>{props.course.chapterTitle}</Typography.Title>
          <Flex align="center" gap={16}>
            <Tag color={props.course.completed ? "success" : "processing"}>
              {props.course.completed ? "Completed" : "In Progress"}
            </Tag>
            <span style={styles.textSecondary}>
              Created: {new Date(props.course.createdDate).toLocaleDateString()}
            </span>
          </Flex>
        </Flex>
        <Flex align="center" gap={8}>
          {props.course.completed && (
            <Flex align="center" gap={8} style={{ fontSize: '0.875rem', color: token.colorSuccess }}>
              <TrophyOutlined style={{ fontSize: 20 }} />
              <span>Course Completed!</span>
            </Flex>
          )}
          <Popconfirm
            title="Delete Course"
            description="Are you sure you want to delete this course? This action cannot be undone."
            onConfirm={handleDeleteCourse}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}  >Delete</Button>
          </Popconfirm>
        </Flex>
      </Flex>
    </Card>
  );

  const ProgressOverview = () => (
    <Card>
      <Flex vertical gap={16}>
        <Flex align="center" justify="space-between">
          <h3>Progress Overview</h3>
          <span style={styles.textSecondary}>
            {completedTasks} of {tasks.length} tasks completed
          </span>
        </Flex>
        <Progress percent={Math.round(progressPercentage)} />
      </Flex>
    </Card>
  );

  const NoTasksAvailableCard = () => {
    return (
      <Card>
        <Flex vertical align="center" style={{ padding: 32, textAlign: 'center' }}>
          <CheckSquareOutlined
            style={{
              fontSize: 48,
              marginBottom: 16,
              color: token.colorTextSecondary,
            }} />
          <h3>No Tasks Available</h3>
          <p style={{ color: token.colorTextSecondary }}>
            Tasks are being generated for this chapter. Please check back later.
          </p>
        </Flex>
      </Card>
    );
  }

  function renderTask(task: Task, index: number) {
    return (
      <Card key={task.id}
        title={<Flex align="center" justify="space-between">
          <Flex align="stretch" gap={12}>
            <Flex vertical justify="center">
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor: token.colorFillSecondary,
                  color: token.colorText,
                }}
              >
                {index + 1}
              </Flex>
            </Flex>
            <Flex vertical gap={4} justify="center">
              <Typography.Text strong style={{ fontSize: '1rem' }}>{task.question}</Typography.Text>
            </Flex>
          </Flex>
          {submitting[task.id] ? (
            <LoadingOutlined style={{ fontSize: 20, color: token.colorTextSecondary }} spin />
          ) : task.completed ? (
            isTaskCorrect(task) ? (
              <CheckCircleOutlined style={{ fontSize: 20, color: token.colorSuccess }} />
            ) : (
              <CloseCircleOutlined style={{ fontSize: 20, color: token.colorError }} />
            )
          ) : (
            <BorderOutlined style={{ fontSize: 20, color: token.colorTextSecondary }} />
          )}
        </Flex>}
      >
        <Flex vertical gap={24}>
          <TaskItem
            task={task}
            value={taskAnswers[task.id]}
            isSubmitting={submitting[task.id]}
            onChange={(val) => handleTaskAnswer(task.id, val)}
            onRetake={() => handleRetakeTask(task)} />

          {!task.completed && (
            <Button
              onClick={() => handleSubmitTask(task)}
              type="primary"
              style={{ alignSelf: 'flex-start' }}
              loading={submitting[task.id]}
              disabled={isSubmitButtonDisabled(task)}
            >
              {submitting[task.id] ? 'Submitting...' : 'Submit Answer'}
            </Button>
          )}
        </Flex>
      </Card>
    );
  }

  const MainContent = () => (
    <Tabs
      type="card"
      activeKey={activeTab}
      onChange={(key) => setActiveTab(key)}
      items={[
        {
          key: "notes",
          label: (
            <Flex align="center" gap={8}>
              <BookOutlined style={{ width: 16, height: 16 }} />
              Study Notes
            </Flex>
          ),
          children: <RichTextEditor content={props.course.notes} onSave={saveNotes} />,
        },
        {
          key: "tasks",
          label: (
            <Flex align="center" gap={8}>
              <CheckSquareOutlined style={{ width: 16, height: 16 }} />
              Practice Tasks ({completedTasks}/{tasks.length})
            </Flex>
          ),
          children: (
            <Flex vertical gap={24} style={{ marginTop: 24 }}>
              {tasks.map((task, index) => renderTask(task, index))}

              {tasks.length === 0 && (
                <NoTasksAvailableCard />
              )}
            </Flex>
          ),
        },
      ]} />
  );

  return (
    <Flex vertical gap={24} style={styles.pageContainer}>
      <CourseHeader />
      <ProgressOverview />
      <MainContent />
    </Flex>
  );
}