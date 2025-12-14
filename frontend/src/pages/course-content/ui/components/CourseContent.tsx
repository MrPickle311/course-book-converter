import { Card, Button, Progress, Checkbox, Input, Alert, Flex, Space, Tabs, Typography, Tag, theme } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, BookOutlined, CheckSquareOutlined, TrophyOutlined, LoadingOutlined, EditOutlined, FilePdfOutlined, BorderOutlined } from '@ant-design/icons';
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import ReactMarkdown from 'react-markdown'
import { MdxStyles } from '../../../../shared/components/MdxStyles.tsx';
import { MarkdownEditModal } from '../../../../shared/components/MarkdownEditModal.tsx';
import type { Course } from "../../../../entities/course/model/types.ts";
import { useCourse } from '../hooks/useCourse.ts';
import { getCourseStyles } from '../styles/styles.ts';

const { useToken } = theme;

export interface CourseContentProps {
  course: Course;
  onUpdateCourse: (course: Course) => void;
}

export function CourseContent({ course, onUpdateCourse }: CourseContentProps) {
  const { token } = useToken();
  const styles = getCourseStyles(token);

  const {
    activeTab,
    setActiveTab,
    taskAnswers,
    handleTaskAnswer,
    toggleMultiSelectOption,
    handleSubmitTask,
    handleRetakeTask,
    submitting,
    editOpen,
    setEditOpen,
    handleNotesSave,
    openFilePicker,
    completedTasks,
    progressPercentage,
    isTaskCorrect
  } = useCourse(course, onUpdateCourse);

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

  return (
    <Flex vertical gap={24} style={styles.container}>
      {/* Course Header */}
      <Card>
        <Flex justify="space-between" align="flex-start">
          <Flex vertical gap={8}>
            <Flex
              align="center"
              gap={8}
              style={styles.headerMeta}
            >
              <BookOutlined style={{ width: 16, height: 16 }} />
              <span>{course.bookTitle}</span>
            </Flex>
            <Typography.Title level={3} style={styles.headerTitle}>{course.chapterTitle}</Typography.Title>
            <Flex align="center" gap={16}>
              <Tag color={course.completed ? "success" : "processing"}>
                {course.completed ? "Completed" : "In Progress"}
              </Tag>
              <span style={styles.headerMeta}>
                Created: {new Date(course.createdDate).toLocaleDateString()}
              </span>
            </Flex>
          </Flex>
          <Flex align="center" gap={8}>
            {course.completed && (
              <Flex align="center" gap={8} style={styles.successText}>
                <TrophyOutlined style={{ fontSize: 20 }} />
                <span>Course Completed!</span>
              </Flex>
            )}
            <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>Edit</Button>
          </Flex>
        </Flex>
      </Card>

      {/* Progress Overview */}
      <Card>
        <Flex vertical gap={16}>
          <Flex align="center" justify="space-between">
            <h3>Progress Overview</h3>
            <span style={styles.progressText}>
              {completedTasks} of {course.tasks.length} tasks completed
            </span>
          </Flex>
          <Progress percent={Math.round(progressPercentage)} />
        </Flex>
      </Card>

      {/* Main Content */}
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
                    <Flex vertical gap={24}>{renderBlocks(course.notes)}</Flex>
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
                Practice Tasks ({completedTasks}/{course.tasks.length})
              </Flex>
            ),
            children: (
              <Flex vertical gap={24} style={{ marginTop: 24 }}>
                {course.tasks.map((task, index) => (
                  <Card key={task.id}
                    title={
                      <Flex align="center" justify="space-between">
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
                      </Flex>
                    }
                  >
                    <Flex vertical gap={24} >
                      {task.type === 'multiple-choice' && task.options && (
                        <Flex vertical gap={16}>
                          <Flex vertical gap={8}>
                            {task.options.map((option, optionIndex) => {
                              const isCompleted = task.completed;
                              const current = isCompleted ? (task.userAnswer || '') : (((taskAnswers[task.id] as string) || ''));
                              const isSelected = current === option.id;
                              const isCorrectOption = option.id === task.correctAnswerId;
                              let colorStyle = {};
                              if (isCompleted) {
                                const isOverallCorrect = task.userAnswer === task.correctAnswerId;
                                if (isOverallCorrect) {
                                  if (isCorrectOption) colorStyle = { color: token.colorSuccess, fontWeight: 500 };
                                } else {
                                  if (isCorrectOption) colorStyle = { color: token.colorSuccess, fontWeight: 500 };
                                  else if (isSelected) colorStyle = { color: token.colorError, fontWeight: 500 };
                                }
                              }

                              return (
                                <Space key={optionIndex} align="center">
                                  <Checkbox
                                    id={`${task.id}-sc-${optionIndex}`}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (task.completed) return;
                                      if (e.target.checked) handleTaskAnswer(task.id, option.id);
                                    }}
                                    disabled={task.completed}
                                  />
                                  <label htmlFor={`${task.id}-sc-${optionIndex}`} style={{ cursor: task.completed ? 'default' : 'pointer', ...colorStyle }}>
                                    {option.label}
                                  </label>
                                </Space>
                              );
                            })}
                          </Flex>
                          {task.completed && (
                            <Alert
                              type={task.userAnswer === task.correctAnswerId ? 'success' : 'error'}
                              message={task.userAnswer === task.correctAnswerId ? 'Correct' : 'Incorrect'}
                              showIcon
                            />
                          )}
                          {!isTaskCorrect(task) && task.completed && (
                            <Flex gap={8} style={{ marginTop: 8 }}>
                              <Button size="small" onClick={() => handleRetakeTask(task)}>Retake</Button>
                            </Flex>
                          )}
                        </Flex>
                      )}

                      {task.type === 'multiple-select' && task.options && (
                        <Flex vertical gap={16}>
                          <Flex vertical gap={8}>
                            {task.options.map((option, optionIndex) => {
                              const isCompleted = task.completed;
                              const current = isCompleted ? (task.userAnswers || []) : (((taskAnswers[task.id] as string[]) || []));
                              const isSelected = current.includes(option.id);
                              const isCorrectOption = task.correctAnswerIds?.includes(option.id);
                              let colorStyle = {};
                              if (isCompleted) {
                                const expected = task.correctAnswerIds || [];
                                const isOverallCorrect = expected.every(correct => (task.userAnswers || []).includes(correct)) && expected.length === (task.userAnswers || []).length;
                                if (isOverallCorrect) {
                                  if (isCorrectOption) colorStyle = { color: token.colorSuccess, fontWeight: 500 };
                                } else {
                                  if (isCorrectOption) colorStyle = { color: token.colorSuccess, fontWeight: 500 };
                                  else if (isSelected) colorStyle = { color: token.colorError, fontWeight: 500 };
                                }
                              }

                              return (
                                <Space key={optionIndex} align="center">
                                  <Checkbox
                                    id={`${task.id}-ms-${optionIndex}`}
                                    checked={isSelected}
                                    onChange={() => toggleMultiSelectOption(task.id, option.id)}
                                    disabled={task.completed}
                                  />
                                  <label htmlFor={`${task.id}-ms-${optionIndex}`} style={{ cursor: task.completed ? 'default' : 'pointer', ...colorStyle }}>
                                    {option.label}
                                  </label>
                                </Space>
                              );
                            })}
                          </Flex>
                          {task.completed && (
                            <Alert
                              type={task.evaluation?.isCorrect ? 'success' : 'error'}
                              message={task.evaluation?.isCorrect ? 'Correct' : 'Incorrect'}
                              showIcon
                            />
                          )}
                          {!isTaskCorrect(task) && task.completed && (
                            <Flex gap={8} style={{ marginTop: 8 }}>
                              <Button size="small" onClick={() => handleRetakeTask(task)}>Retake</Button>
                            </Flex>
                          )}
                        </Flex>
                      )}

                      {(task.type === 'short-answer' || task.type === 'code') && (
                        <Flex vertical gap={16}>
                          {task.completed && (
                            <Typography.Text strong>
                              Your answer
                            </Typography.Text>
                          )}
                          <Input.TextArea
                            placeholder={'Enter your answer...'}
                            value={(task.completed ? (task.userAnswer || '') : ((taskAnswers[task.id] as string) || ''))}
                            onChange={(e) => handleTaskAnswer(task.id, e.target.value)}
                            disabled={task.completed}
                            rows={4}
                          />
                          {submitting[task.id] && (
                            <Typography.Text type="secondary">
                              Evaluating answer...
                            </Typography.Text>
                          )}
                          {task.evaluation && (
                            <>
                              {typeof task.evaluation.score === 'number' && (
                                <Alert
                                  type={task.evaluation.isCorrect ? 'success' : 'error'}
                                  message={`Score: ${Math.round(task.evaluation.score * 100)}%`}
                                  showIcon
                                />
                              )}
                              {!task.evaluation.isCorrect && (
                                <Flex
                                  vertical
                                  gap={8}
                                  style={styles.feedbackBox}
                                >
                                  <Typography.Text strong>
                                    Feedback:
                                  </Typography.Text>
                                  <Flex vertical gap={4} style={{ fontSize: '0.875rem', marginTop: 8 }}>
                                    {task.evaluation.mistakes.map((m, idx) => (
                                      <Flex key={idx} align="flex-start" gap={8}>
                                        <span>•</span>
                                        <span>{m}</span>
                                      </Flex>
                                    ))}
                                  </Flex>
                                </Flex>
                              )}
                              {!task.evaluation.isCorrect && (
                                <Flex gap={8} style={{ marginTop: 8 }}>
                                  <Button size="small" onClick={() => handleRetakeTask(task)}>Retake</Button>
                                </Flex>
                              )}
                            </>
                          )}
                        </Flex>
                      )}

                      {task.type === 'upload-pdf' && (
                        <Flex vertical gap={16}>
                          <Button
                            icon={<FilePdfOutlined />}
                            onClick={() => openFilePicker(task.id)}
                            disabled={task.completed}
                            style={{ alignSelf: 'flex-start' }}
                          >
                            Upload PDF
                          </Button>
                          <input
                            id={`file-input-${task.id}`}
                            style={{ display: 'none' }}
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => handleTaskAnswer(task.id, e.target.files?.[0] || null)}
                            disabled={task.completed}
                          />
                          {!task.completed && (
                            <Typography.Text type="secondary">
                              {((taskAnswers[task.id] as File | undefined)?.name
                                ? <>Selected: {(taskAnswers[task.id] as File).name}</>
                                : <>No file selected</>)}
                            </Typography.Text>
                          )}
                          {submitting[task.id] && (
                            <Typography.Text type="secondary">
                              Validating PDF...
                            </Typography.Text>
                          )}
                          {task.completed && task.userFileName && (
                            <Flex style={styles.infoTone}>
                              <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>
                                <strong>Uploaded file:</strong> {task.userFileName}
                              </p>
                            </Flex>
                          )}
                          {task.evaluation && (
                            <>
                              {typeof task.evaluation.score === 'number' && (
                                <Alert
                                  type={task.evaluation.isCorrect ? 'success' : 'error'}
                                  message={`Score: ${Math.round(task.evaluation.score * 100)}%`}
                                  showIcon
                                />
                              )}
                              {!task.evaluation.isCorrect && (
                                <Flex
                                  vertical
                                  gap={8}
                                  style={styles.feedbackBox}
                                >
                                  <Typography.Text strong>
                                    Feedback:
                                  </Typography.Text>
                                  <Flex vertical gap={4} style={{ fontSize: '0.875rem', marginTop: 8 }}>
                                    {task.evaluation.mistakes.map((m, idx) => (
                                      <Flex key={idx} align="flex-start" gap={8}>
                                        <span>•</span>
                                        <span>{m}</span>
                                      </Flex>
                                    ))}
                                  </Flex>
                                </Flex>
                              )}
                              {!task.evaluation.isCorrect && (
                                <Flex gap={8} style={{ marginTop: 8 }}>
                                  <Button size="small" onClick={() => handleRetakeTask(task)}>Retake</Button>
                                </Flex>
                              )}
                            </>
                          )}
                        </Flex>
                      )}

                      {!task.completed && (
                        <Button
                          onClick={() => handleSubmitTask(task)}
                          type="primary"
                          style={{ alignSelf: 'flex-start' }}
                          loading={submitting[task.id]}
                          disabled={
                            (task.type === 'multiple-choice' || task.type === 'short-answer' || task.type === 'code')
                              ? !taskAnswers[task.id]
                              : task.type === 'multiple-select'
                                ? ((taskAnswers[task.id] as string[] | undefined)?.length || 0) === 0
                                : task.type === 'upload-pdf'
                                  ? !taskAnswers[task.id]
                                  : true
                          }
                        >
                          {submitting[task.id] ? 'Submitting...' : 'Submit Answer'}
                        </Button>
                      )}
                    </Flex>
                  </Card>
                ))}

                {course.tasks.length === 0 && (
                  <Card>
                    <Flex vertical align="center" style={{ padding: 32, textAlign: 'center' }}>
                      <CheckSquareOutlined
                        style={{
                          fontSize: 48,
                          marginBottom: 16,
                          color: token.colorTextSecondary,
                        }}
                      />
                      <h3>No Tasks Available</h3>
                      <p style={{ color: token.colorTextSecondary }}>
                        Tasks are being generated for this chapter. Please check back later.
                      </p>
                    </Flex>
                  </Card>
                )}
              </Flex>
            ),
          },
        ]}
      />
      <MarkdownEditModal
        open={editOpen}
        title="Edit Notes"
        initialValue={course.notes}
        onClose={() => setEditOpen(false)}
        onSave={handleNotesSave}
      />
    </Flex>
  );
}