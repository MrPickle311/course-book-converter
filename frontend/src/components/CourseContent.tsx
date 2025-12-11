import { useState } from 'react';
import { Card, Button, Progress, Checkbox, Input, Alert, Flex, Space, Tabs, Typography, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, BookOutlined, CheckSquareOutlined, TrophyOutlined, LoadingOutlined, EditOutlined, FilePdfOutlined, BorderOutlined } from '@ant-design/icons';
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import ReactMarkdown from 'react-markdown'

interface TaskOption { id: string; label: string }

interface Task {
  id: string;
  question: string;
  type: 'multiple-choice' | 'multiple-select' | 'short-answer' | 'upload-pdf' | 'code';
  options?: TaskOption[];
  correctAnswerId?: string;
  correctAnswerIds?: string[];
  userAnswer?: string;
  userAnswers?: string[];
  userFileName?: string;
  feedback?: string;
  evaluation?: {
    isCorrect: boolean;
    mistakes: string[];
    score?: number;
    explanation?: string;
  };
  completed: boolean;
}

import '../styles/mdx.css';
import { DefaultService } from '@/openapi';
import React from 'react';
import { MarkdownEditModal } from './MarkdownEditModal';

export interface Course {
  id: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  notes: string;
  tasks: Task[];
  createdDate: string;
  completed: boolean;
  userId: string;
}

export interface CourseContentProps {
  course: Course;
  onUpdateCourse: (course: Course) => void;
}

const infoToneStyles: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: '1px solid var(--border)',
  backgroundColor: 'var(--accent)',
  color: 'var(--accent-foreground)',
};

export function CourseContent({ course, onUpdateCourse }: CourseContentProps) {
  const [activeTab, setActiveTab] = useState('notes');
  const [taskAnswers, setTaskAnswers] = useState<Record<string, string | string[] | File | null>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [editOpen, setEditOpen] = useState(false);
  const openFilePicker = (taskId: string) => {
    const input = document.getElementById(`file-input-${taskId}`) as HTMLInputElement | null;
    if (input) {
      input.click();
    }
  };

  const completedTasks = course.tasks.filter(task => task.completed).length;
  const progressPercentage = course.tasks.length > 0 ? (completedTasks / course.tasks.length) * 100 : 0;

  const handleTaskAnswer = (taskId: string, answer: string | string[] | File | null) => {
    setTaskAnswers(prev => ({ ...prev, [taskId]: answer }));
  };

  const toggleMultiSelectOption = (taskId: string, optionId: string) => {
    setTaskAnswers(prev => {
      const current = (prev[taskId] as string[] | undefined) || [];
      const exists = current.includes(optionId);
      const next = exists ? current.filter(o => o !== optionId) : [...current, optionId];
      return { ...prev, [taskId]: next };
    });
  };

  const mapEvaluation = (raw: any): Task["evaluation"] | undefined => {
    if (!raw) return undefined;
    return {
      isCorrect: Boolean(raw.isCorrect),
      mistakes: raw.mistakes || [],
      score: typeof raw.score === 'number' ? raw.score : undefined,
      explanation: raw.explanation,
    };
  };

  const isTaskCorrect = (task: Task): boolean | null => {
    if (!task.completed) {
      return null;
    }
    if (task.type === 'multiple-select') {
      return task.evaluation?.isCorrect === true;
    }
    if (task.type === 'multiple-choice') {
      if (Array.isArray(task.correctAnswerIds) && task.correctAnswerIds.length > 0) {
        return task.evaluation?.isCorrect === true;
      }
      return task.userAnswer === task.correctAnswerId;
    }
    if (task.type === 'short-answer' || task.type === 'code' || task.type === 'upload-pdf') {
      return task.evaluation?.isCorrect === true;
    }
    return null;
  };

  const isTaskFailed = (task: Task): boolean => {
    if (!task.completed) {
      return false;
    }
    return !isTaskCorrect(task);
  };

  const computeCourseCompleted = (tasks: Task[]): boolean => {
    if (tasks.length === 0) {
      return false;
    }
    const allCompleted = tasks.every(t => t.completed);
    if (!allCompleted) {
      return false;
    }
    return !tasks.some(t => isTaskFailed(t));
  };

  React.useEffect(() => {
    (async () => {
      try {
        const res = await DefaultService.getChapterTasks({ uploadId: course.bookId, chapterId: course.chapterId });
        const items = (res as any)?.tasks || [];
        const mapped: Task[] = items.map((tw: any) => {
          const def = tw.definition;
          const st = tw.state || {};
          const type = def.type as Task['type'];
          const opts = Array.isArray(def.options) ? def.options.map((o: any) => ({ id: o.id, label: o.label })) : undefined;
          return {
            id: def.id,
            question: def.question,
            type,
            options: opts,
            correctAnswerId: def.correctAnswerId,
            correctAnswerIds: def.correctAnswerIds,
            userAnswer: st.userAnswer,
            userAnswers: st.userAnswers,
            userFileName: st.userFileName,
            feedback: (st.evaluation as any)?.explanation,
            evaluation: st.evaluation ? {
              isCorrect: Boolean(st.evaluation.isCorrect),
              mistakes: st.evaluation.mistakes || [],
              score: typeof st.evaluation.score === 'number' ? st.evaluation.score : undefined,
              explanation: (st.evaluation as any)?.explanation,
            } : undefined,
            completed: Boolean(st.completed),
          } as Task;
        });
        const updatedCourse = {
          ...course,
          tasks: mapped,
          completed: computeCourseCompleted(mapped)
        };
        onUpdateCourse(updatedCourse);
      } catch (e) {
        console.error('Failed to load tasks', e);
      }
    })();
  }, [activeTab, course.bookId, course.chapterId]);

  const handleRetakeTask = (task: Task) => {
    const resetTask: Task = {
      ...task,
      userAnswer: undefined,
      userAnswers: undefined,
      userFileName: undefined,
      feedback: undefined,
      evaluation: undefined,
      completed: false
    } as Task;
    setTaskAnswers(prev => {
      const next = { ...prev };
      delete next[task.id];
      return next;
    });
    const updatedTasks = course.tasks.map(t => t.id === task.id ? resetTask : t);
    const updatedCourse = {
      ...course,
      tasks: updatedTasks,
      completed: computeCourseCompleted(updatedTasks)
    };
    onUpdateCourse(updatedCourse);
  };

  const handleSubmitTask = (task: Task) => {
    const answer = taskAnswers[task.id];
    if (task.type === 'multiple-select') {
      const list = (answer as string[] | undefined) || [];
      if (list.length === 0) {
        return;
      }
      setSubmitting(prev => ({ ...prev, [task.id]: true }));
      (async () => {
        try {
          const resp = await DefaultService.submitTask({
            taskId: task.id,
            requestBody: {
              type: task.type,
              selectedOptionIds: list,
            } as any,
          });
          const updatedTask = {
            ...task,
            userAnswers: list,
            evaluation: mapEvaluation(resp.evaluation),
            completed: true,
          } as Task;
          const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
          const updatedCourse = {
            ...course,
            tasks: updatedTasks,
            completed: computeCourseCompleted(updatedTasks)
          };
          onUpdateCourse(updatedCourse);
        } catch (e) {
          console.error('Submit multi-select failed', e);
        } finally {
          setSubmitting(prev => ({ ...prev, [task.id]: false }));
        }
      })();
      return;
    }

    if (task.type === 'upload-pdf') {
      const file = answer as File | undefined;
      if (!file) {
        return;
      }
      setSubmitting(prev => ({ ...prev, [task.id]: true }));
      (async () => {
        try {
          const resp = await DefaultService.submitTaskFile({
            taskId: task.id,
            formData: { file }
          });
          const updatedTask = {
            ...task,
            userFileName: file.name,
            evaluation: mapEvaluation(resp.evaluation),
            completed: true,
          } as Task;
          const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
          const updatedCourse = {
            ...course,
            tasks: updatedTasks,
            completed: computeCourseCompleted(updatedTasks)
          };
          onUpdateCourse(updatedCourse);
        } catch (e) {
          console.error('Submit upload-pdf failed', e);
        } finally {
          setSubmitting(prev => ({ ...prev, [task.id]: false }));
        }
      })();
      return;
    }

    const userAnswer = (answer as string | undefined) || '';
    if (!userAnswer) {
      return;
    }

    if (task.type === 'short-answer') {
      setSubmitting(prev => ({ ...prev, [task.id]: true }));
      (async () => {
        try {
          const resp = await DefaultService.submitTask({
            taskId: task.id,
            requestBody: {
              type: task.type,
              textAnswer: userAnswer,
            } as any,
          });
          const updatedTask = {
            ...task,
            userAnswer,
            evaluation: mapEvaluation(resp.evaluation),
            completed: true,
            userFileName: undefined,
          } as Task;
          const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
          const updatedCourse = { ...course, tasks: updatedTasks, completed: computeCourseCompleted(updatedTasks) };
          onUpdateCourse(updatedCourse);
        } catch (e) {
          console.error('Submit short-answer failed', e);
        } finally {
          setSubmitting(prev => ({ ...prev, [task.id]: false }));
        }
      })();
      return;
    }

    if (task.type === 'multiple-choice') {
      setSubmitting(prev => ({ ...prev, [task.id]: true }));
      (async () => {
        try {
          const resp = await DefaultService.submitTask({
            taskId: task.id,
            requestBody: {
              type: task.type,
              selectedOptionId: userAnswer,
            } as any,
          });
          const updatedTask = {
            ...task,
            userAnswer,
            evaluation: mapEvaluation(resp.evaluation),
            completed: true,
            userFileName: undefined,
          } as Task;
          const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
          const updatedCourse = {
            ...course,
            tasks: updatedTasks,
            completed: computeCourseCompleted(updatedTasks)
          };
          onUpdateCourse(updatedCourse);
        } catch (e) {
          console.error('Submit multiple-choice failed', e);
        } finally {
          setSubmitting(prev => ({ ...prev, [task.id]: false }));
        }
      })();
      return;
    }

    // Fallback (should not hit)
  };

  const renderBlocks = (notes: string) => {
    return (
      <div className="mdx-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {notes}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <Flex vertical gap={24} style={{ maxWidth: '72rem', margin: '0 auto' }}>
      {/* Course Header */}
      <Card>
        <Flex justify="space-between" align="flex-start">
          <Flex vertical gap={8}>
            <Flex
              align="center"
              gap={8}
              style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}
            >
              <BookOutlined style={{ width: 16, height: 16 }} />
              <span>{course.bookTitle}</span>
            </Flex>
            <Typography.Title level={3} style={{ margin: 0 }}>{course.chapterTitle}</Typography.Title>
            <Flex align="center" gap={16}>
              <Tag color={course.completed ? "success" : "processing"}>
                {course.completed ? "Completed" : "In Progress"}
              </Tag>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Created: {new Date(course.createdDate).toLocaleDateString()}
              </span>
            </Flex>
          </Flex>
          <Flex align="center" gap={8}>
            {course.completed && (
              <Flex align="center" gap={8} style={{ color: '#16a34a' }}>
                <TrophyOutlined style={{ fontSize: 20 }} />
                <span style={{ fontSize: '0.875rem' }}>Course Completed!</span>
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
            <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
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
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 9999,
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                backgroundColor: '#e5e7eb',
                                color: '#4b5563',
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
                          <LoadingOutlined style={{ fontSize: 20, color: 'var(--muted-foreground)' }} spin />
                        ) : task.completed ? (
                          isTaskCorrect(task) ? (
                            <CheckCircleOutlined style={{ fontSize: 20, color: '#16a34a' }} />
                          ) : (
                            <CloseCircleOutlined style={{ fontSize: 20, color: '#dc2626' }} />
                          )
                        ) : (
                          <BorderOutlined style={{ fontSize: 20, color: 'var(--muted-foreground)' }} />
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
                              // For Antd Checkbox inside Flex, we can just use styles
                              let colorStyle = {};
                              if (isCompleted) {
                                const isOverallCorrect = task.userAnswer === task.correctAnswerId;
                                if (isOverallCorrect) {
                                  if (isCorrectOption) colorStyle = { color: '#16a34a', fontWeight: 500 };
                                } else {
                                  if (isCorrectOption) colorStyle = { color: '#16a34a', fontWeight: 500 };
                                  else if (isSelected) colorStyle = { color: '#dc2626', fontWeight: 500 };
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
                                  if (isCorrectOption) colorStyle = { color: '#16a34a', fontWeight: 500 };
                                } else {
                                  if (isCorrectOption) colorStyle = { color: '#16a34a', fontWeight: 500 };
                                  else if (isSelected) colorStyle = { color: '#dc2626', fontWeight: 500 };
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
                                  style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}
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
                            <Flex style={infoToneStyles}>
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
                                  style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}
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
                          color: 'var(--muted-foreground)',
                        }}
                      />
                      <h3>No Tasks Available</h3>
                      <p style={{ color: 'var(--muted-foreground)' }}>
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
        onSave={(value) => {
          const updatedCourse = { ...course, notes: value };
          onUpdateCourse(updatedCourse);
          setEditOpen(false);
        }}
      />
    </Flex>
  );
}