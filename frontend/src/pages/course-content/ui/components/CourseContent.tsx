import { Card, Progress, Flex, Tabs, Typography, Tag, theme, Button } from 'antd';
import { BookOutlined, CheckSquareOutlined, TrophyOutlined, LoadingOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, BorderOutlined } from '@ant-design/icons';
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import ReactMarkdown from 'react-markdown'
import { MdxStyles } from '../styles/MdxStyles.tsx';
import { MarkdownEditModal } from './MarkdownEditModal.tsx';
import type { Course, Task } from "@/entities/course/model/types.ts";
import { useCourse } from '../hooks/useCourse.ts';
import { getCourseStyles } from "../styles/courseContentStyles.ts";
import { TaskItem } from "./Task.tsx";

export interface CourseContentProps {
  course: Course;
  onUpdateCourse: (course: Course) => void;
}

export function CourseContent(props: CourseContentProps) {
  const { token } = theme.useToken();
  const styles = getCourseStyles(token);

  const {
    activeTab,
    setActiveTab,
    taskAnswers,
    handleTaskAnswer,
    handleSubmitTask,
    handleRetakeTask,
    submitting,
    editOpen,
    setEditOpen,
    handleNotesSave,
    completedTasks,
    progressPercentage,
    isTaskCorrect
  } = useCourse(props.course, props.onUpdateCourse);

  const renderBlocks = (notes: string) => {
    return (
      <div className="mdx-content">
        <MdxStyles token={token} />
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {notes}
        </ReactMarkdown>
      </div>
    );
  };

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

  const CourseHeader =  () => 
  <Card>
    <Flex justify="space-between" align="flex-start">
      <Flex vertical gap={8}>
        <Flex
          align="center"
          gap={8}
          style={styles.headerMeta}
        >
          <BookOutlined style={{ width: 16, height: 16 }} />
          <span>{props.course.bookTitle}</span>
        </Flex>
        <Typography.Title level={3} style={styles.headerTitle}>{props.course.chapterTitle}</Typography.Title>
        <Flex align="center" gap={16}>
          <Tag color={props.course.completed ? "success" : "processing"}>
            {props.course.completed ? "Completed" : "In Progress"}
          </Tag>
          <span style={styles.headerMeta}>
            Created: {new Date(props.course.createdDate).toLocaleDateString()}
          </span>
        </Flex>
      </Flex>
      <Flex align="center" gap={8}>
        {props.course.completed && (
          <Flex align="center" gap={8} style={styles.successText}>
            <TrophyOutlined style={{ fontSize: 20 }} />
            <span>Course Completed!</span>
          </Flex>
        )}
        <Button
          icon={<EditOutlined />}
          onClick={() => setEditOpen(true)}
        >
          Edit
        </Button>
      </Flex>
    </Flex>
  </Card>;

  const ProgressOverview = () => 
  <Card>
    <Flex vertical gap={16}>
      <Flex align="center" justify="space-between">
        <h3>Progress Overview</h3>
        <span style={styles.progressText}>
          {completedTasks} of {props.course.tasks.length} tasks completed
        </span>
      </Flex>
      <Progress percent={Math.round(progressPercentage)} />
    </Flex>
  </Card>;


  const NoTasksAvailableCard = () => {
    return <Card>
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
    </Card>;
  }

  function renderTask(task: Task, index: number) {
    return <Card key={task.id}
      title={<Flex align="center" justify="space-between">
        <Flex align="stretch" gap={12}>
          <Flex vertical justify="center">
            <Flex
              align="center"
              justify="center"
              style={styles.taskIndexCircle}
            >
              {index + 1}
            </Flex>
          </Flex>
          <Flex vertical gap={4} justify="center">
            <Typography.Text strong style={styles.taskQuestion}>{task.question}</Typography.Text>
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
          isSubmitting={!!submitting[task.id]}
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
    </Card>;
  }

  const MainContent = () => 
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
        children: (
          <Flex vertical style={{ marginTop: 24 }}>
            <Card>
              <div className="prose prose-slate max-w-none">
                <Flex vertical gap={24}>
                  {renderBlocks(props.course.notes)}
                </Flex>
              </div>
            </Card>
          </Flex>
        ),
      },
      {
        key: "tasks",
        label: (
          <Flex align="center" gap={8}>
            <CheckSquareOutlined style={{ width: 16, height: 16 }} />
            Practice Tasks ({completedTasks}/{props.course.tasks.length})
          </Flex>
        ),
        children: (
          <Flex vertical gap={24} style={{ marginTop: 24 }}>
            {props.course.tasks.map((task, index) => renderTask(task, index))}

            {props.course.tasks.length === 0 && (
              <NoTasksAvailableCard/>
            )}
          </Flex>
        ),
      },
    ]} />;

  return (
    <Flex vertical gap={24} style={styles.container}>
      <CourseHeader/>
      <ProgressOverview/>
      <MainContent/>
      <MarkdownEditModal
        open={editOpen}
        title="Edit Notes"
        initialValue={props.course.notes}
        onClose={() => setEditOpen(false)}
        onSave={handleNotesSave}
      />
    </Flex>
  );
}