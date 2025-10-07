import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { CheckCircle, Circle, XCircle, BookOpen, CheckSquare, Award, Loader2 } from 'lucide-react';
import * as runtime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'

interface Task {
  id: string;
  question: string;
  type: 'multiple-choice' | 'multiple-select' | 'short-answer' | 'code' | 'upload-pdf';
  options?: string[];
  correctAnswer?: string;
  correctAnswers?: string[];
  userAnswer?: string;
  userAnswers?: string[];
  userFileName?: string;
  feedback?: string;
  expectedKeywords?: string[];
  evaluation?: {
    isCorrect: boolean;
    mistakes: string[];
    score?: number;
    explanation?: string;
  };
  completed: boolean;
}

import { MDXProvider } from '@mdx-js/react';
import {compileSync, runSync} from '@mdx-js/mdx'
import '../styles/mdx.css';

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

export function CourseContent({ course, onUpdateCourse }: CourseContentProps) {
  console.log(course);
  const [activeTab, setActiveTab] = useState('notes');
  const [taskAnswers, setTaskAnswers] = useState<Record<string, string | string[] | File | null>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const openFilePicker = (taskId: string) => {
    const input = document.getElementById(`file-input-${taskId}`) as HTMLInputElement | null;
    if (input) input.click();
  };

  const completedTasks = course.tasks.filter(task => task.completed).length;
  const progressPercentage = course.tasks.length > 0 ? (completedTasks / course.tasks.length) * 100 : 0;

  const handleTaskAnswer = (taskId: string, answer: string | string[] | File | null) => {
    setTaskAnswers(prev => ({ ...prev, [taskId]: answer }));
  };

  const toggleMultiSelectOption = (taskId: string, option: string) => {
    setTaskAnswers(prev => {
      const current = (prev[taskId] as string[] | undefined) || [];
      const exists = current.includes(option);
      const next = exists ? current.filter(o => o !== option) : [...current, option];
      return { ...prev, [taskId]: next };
    });
  };

  const isTaskCorrect = (task: Task): boolean | null => {
    if (!task.completed) return null;
    if (task.type === 'multiple-select') return task.evaluation?.isCorrect === true;
    if (task.type === 'multiple-choice') {
      if (Array.isArray(task.correctAnswers) && task.correctAnswers.length > 0) {
        return task.evaluation?.isCorrect === true;
      }
      return task.userAnswer === task.correctAnswer;
    }
    if (task.type === 'short-answer' || task.type === 'code' || task.type === 'upload-pdf') {
      return task.evaluation?.isCorrect === true;
    }
    return null;
  };

  const isTaskFailed = (task: Task): boolean => {
    if (!task.completed) return false;
    const correct = isTaskCorrect(task);
    return correct === false;
  };

  const computeCourseCompleted = (tasks: Task[]): boolean => {
    if (tasks.length === 0) return false;
    const allCompleted = tasks.every(t => t.completed);
    if (!allCompleted) return false;
    const hasFailed = tasks.some(t => isTaskFailed(t));
    return !hasFailed;
  };

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
      if (list.length === 0) return;
      const correct = task.correctAnswers || [];
      const missing = correct.filter(o => !list.includes(o));
      const extra = list.filter(o => !correct.includes(o));
      const updatedTask = {
        ...task,
        userAnswers: list,
        evaluation: {
          isCorrect: missing.length === 0 && extra.length === 0,
          mistakes: [
            ...(missing.length ? [`Missing choices: ${missing.join(', ')}`] : []),
            ...(extra.length ? [`Extra choices selected: ${extra.join(', ')}`] : []),
          ],
          score: correct.length > 0 ? (list.filter(o => correct.includes(o)).length / correct.length) : undefined,
          explanation: 'Select all correct statements. Partial credit is shown as score.'
        },
        completed: true,
      } as Task;
      const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
      const updatedCourse = {
        ...course,
        tasks: updatedTasks,
        completed: computeCourseCompleted(updatedTasks)
      };
      onUpdateCourse(updatedCourse);
      return;
    }

    if (task.type === 'upload-pdf') {
      const file = answer as File | undefined;
      if (!file) return;
      setSubmitting(prev => ({ ...prev, [task.id]: true }));
      setTimeout(() => {
        const name = file.name.toLowerCase();
        const goodHints = ['notes', 'summary', 'chapter', 'module'];
        const hasHint = goodHints.some(h => name.includes(h));
        const mistakes: string[] = [];
        if (!hasHint) mistakes.push('Filename is not descriptive (expected words like notes/summary/chapter).');
        if (!name.endsWith('.pdf')) mistakes.push('File is not a .pdf.');

        const updatedTask = {
          ...task,
          userFileName: file.name,
          feedback: hasHint ? `Mock review: "${file.name}" received and looks valid.` : `Mock review: "${file.name}" received.`,
          evaluation: {
            isCorrect: mistakes.length === 0,
            mistakes,
            score: mistakes.length === 0 ? 1 : 0,
            explanation: 'Ensure the uploaded PDF relates to the chapter and is clearly named.'
          },
          completed: true,
        } as Task;
        const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
        const updatedCourse = {
          ...course,
          tasks: updatedTasks,
          completed: computeCourseCompleted(updatedTasks)
        };
        onUpdateCourse(updatedCourse);
        setSubmitting(prev => ({ ...prev, [task.id]: false }));
      }, 1200);
      return;
    }

    const userAnswer = (answer as string | undefined) || '';
    if (!userAnswer) return;

    if (task.type === 'short-answer') {
      setSubmitting(prev => ({ ...prev, [task.id]: true }));
      setTimeout(() => {
        const normalized = userAnswer.toLowerCase();
        const expected = task.expectedKeywords || [];
        const found = expected.filter(k => normalized.includes(k.toLowerCase()));
        const missing = expected.filter(k => !found.includes(k));
        const mistakes: string[] = [];
        if (userAnswer.length < 40) mistakes.push('Answer is too short. Provide more detail.');
        if (missing.length) mistakes.push(`Missing key concepts: ${missing.join(', ')}`);
        const score = expected.length ? (found.length / expected.length) : (userAnswer.length >= 40 ? 1 : 0.5);

        const updatedTask = {
          ...task,
          userAnswer,
          feedback: 'Mock feedback: processed your answer and generated guidance.',
          evaluation: {
            isCorrect: mistakes.length === 0,
            mistakes,
            score,
            explanation: 'Answers are checked for presence of core keywords and sufficient detail.'
          },
          completed: true
        } as Task;
        const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
        const updatedCourse = {
          ...course,
          tasks: updatedTasks,
          completed: computeCourseCompleted(updatedTasks)
        };
        onUpdateCourse(updatedCourse);
        setSubmitting(prev => ({ ...prev, [task.id]: false }));
      }, 1000);
      return;
    }

    const baseUpdatedTask = {
      ...task,
      userAnswer,
      completed: true
    } as Task;

    const updatedTask = (task.type === 'multiple-choice')
      ? ({
          ...baseUpdatedTask,
          evaluation: {
            isCorrect: userAnswer === (task.correctAnswer || ''),
            mistakes: userAnswer === (task.correctAnswer || '') ? [] : ['Incorrect option selected.'],
            score: userAnswer === (task.correctAnswer || '') ? 1 : 0,
            explanation: 'Single-choice question evaluated instantly.'
          }
        } as Task)
      : baseUpdatedTask;

    const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
    const updatedCourse = {
      ...course,
      tasks: updatedTasks,
      completed: computeCourseCompleted(updatedTasks)
    };

    onUpdateCourse(updatedCourse);
  };

  const renderBlocks = (notes: string) => {
    try {
    const code = compileSync(notes, { outputFormat: 'function-body',
      development: false, remarkPlugins: [remarkGfm] } );
      console.log(code);
      const runned = runSync(code, runtime ) as any;
      const C = runned.default;
      console.log(C);
    return (
      <div className="mdx-content">
        <MDXProvider>
          <C />
        </MDXProvider>
      </div>
    );
    } catch (e) {
      console.error(e);
      return <div>Error rendering notes</div>;
    }
    
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>{course.bookTitle}</span>
              </div>
              <CardTitle>{course.chapterTitle}</CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant={course.completed ? "default" : "secondary"}>
                  {course.completed ? "Completed" : "In Progress"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created: {new Date(course.createdDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            {course.completed && (
              <div className="flex items-center gap-2 text-green-600">
                <Award className="w-5 h-5" />
                <span className="text-sm">Course Completed!</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3>Progress Overview</h3>
              <span className="text-sm text-muted-foreground">
                {completedTasks} of {course.tasks.length} tasks completed
              </span>
            </div>
            <Progress value={progressPercentage} />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Study Notes
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Practice Tasks ({completedTasks}/{course.tasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardContent className="prose prose-slate max-w-none">
              <div className="space-y-6">
                {renderBlocks(course.notes)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6 space-y-6">
          {course.tasks.map((task, index) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base">{task.question}</CardTitle>
                    </div>
                  </div>
                  {submitting[task.id] ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : task.completed ? (
                    isTaskCorrect(task) ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {task.type === 'multiple-choice' && task.options && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {task.options.map((option, optionIndex) => {
                        const isCompleted = task.completed;
                        const current = isCompleted ? (task.userAnswer || '') : (((taskAnswers[task.id] as string) || ''));
                        const isSelected = current === option;
                        const isCorrectOption = option === task.correctAnswer;
                        let labelClass = '';
                        if (isCompleted) {
                          const isOverallCorrect = task.userAnswer === task.correctAnswer;
                          if (isOverallCorrect) {
                            labelClass = isCorrectOption ? 'text-green-600 font-medium' : '';
                          } else {
                            labelClass = isCorrectOption ? 'text-green-600 font-medium' : (isSelected ? 'text-red-600 font-medium' : '');
                          }
                        }
                        return (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${task.id}-sc-${optionIndex}`}
                              checked={isSelected}
                              onCheckedChange={(checked: boolean | 'indeterminate') => {
                                if (task.completed) return;
                                if (checked === true) handleTaskAnswer(task.id, option);
                              }}
                              disabled={task.completed}
                            />
                            <Label htmlFor={`${task.id}-sc-${optionIndex}`} className={labelClass}>{option}</Label>
                          </div>
                        );
                      })}
                    </div>
                    {task.completed && (
                      <div className={'p-3 border rounded'}
                        style={task.userAnswer === task.correctAnswer ? { backgroundColor: '#ecfdf5', borderColor: '#86efac' } : { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }}>
                        <p className={'text-sm font-medium'}
                          style={task.userAnswer === task.correctAnswer ? { color: '#065f46' } : { color: '#991b1b' }}>
                          {task.userAnswer === task.correctAnswer ? 'Correct' : 'Incorrect'}
                        </p>
                      </div>
                    )}
                    {!isTaskCorrect(task) && task.completed && (
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => handleRetakeTask(task)}>Retake</Button>
                      </div>
                    )}
                  </div>
                )}

                {task.type === 'multiple-select' && task.options && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {task.options.map((option, optionIndex) => {
                        const isCompleted = task.completed;
                        const current = isCompleted ? (task.userAnswers || []) : (((taskAnswers[task.id] as string[]) || []));
                        const isSelected = current.includes(option);
                        const isCorrectOption = task.correctAnswers?.includes(option);
                        let labelClass = '';
                        if (isCompleted) {
                          const isOverallCorrect = task.correctAnswers?.every(correct => (taskAnswers[task.id] as string[])?.includes(correct));
                          if (isOverallCorrect) {
                            labelClass = isCorrectOption ? 'text-green-600 font-medium' : '';
                          } else {
                            labelClass = isCorrectOption ? 'text-green-600 font-medium' : (isSelected ? 'text-red-600 font-medium' : '');
                          }
                        }
                        return (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${task.id}-ms-${optionIndex}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleMultiSelectOption(task.id, option)}
                              disabled={task.completed}
                            />
                            <Label htmlFor={`${task.id}-ms-${optionIndex}`} className={labelClass}>{option}</Label>
                          </div>
                        );
                      })}
                    </div>
                    {task.completed && (
                      <div className={'p-3 border rounded'}
                        style={task.evaluation?.isCorrect ? { backgroundColor: '#ecfdf5', borderColor: '#86efac' } : { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }}>
                        <p className={'text-sm font-medium'}
                          style={task.evaluation?.isCorrect ? { color: '#065f46' } : { color: '#991b1b' }}>
                          {task.evaluation?.isCorrect ? 'Correct' : 'Incorrect'}
                        </p>
                      </div>
                    )}
                    {!isTaskCorrect(task) && task.completed && (
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => handleRetakeTask(task)}>Retake</Button>
                      </div>
                    )}
                  </div>
                )}

                {(task.type === 'short-answer' || task.type === 'code') && (
                  <div className="space-y-4">
                    {task.completed && (
                      <div className="text-sm font-medium">Your answer</div>
                    )}
                    <Textarea
                      placeholder={task.type === 'code' ? 'Write your code here...' : 'Enter your answer...'}
                      value={(task.completed ? (task.userAnswer || '') : ((taskAnswers[task.id] as string) || ''))}
                      onChange={(e) => handleTaskAnswer(task.id, e.target.value)}
                      disabled={task.completed}
                      className={task.type === 'code' ? 'font-mono' : ''}
                      rows={task.type === 'code' ? 8 : 4}
                    />
                    {submitting[task.id] && (
                      <div className="text-sm text-muted-foreground">Evaluating answer...</div>
                    )}
                    {task.evaluation && (
                      <>
                        <div className={'p-3 border rounded'}
                          style={task.evaluation.isCorrect ? { backgroundColor: '#ecfdf5', borderColor: '#86efac' } : { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }}>
                          {typeof task.evaluation.score === 'number' && (
                            <p className={'text-sm font-medium'}
                              style={task.evaluation.isCorrect ? { color: '#065f46' } : { color: '#991b1b' }}>
                              Score: {Math.round(task.evaluation.score * 100)}%
                            </p>
                          )}
                        </div>
                        {!task.evaluation.isCorrect && (
                          <div className="p-3 border rounded">
                            <div className="text-sm font-medium">Feedback:</div>
                            <div className="mt-2 space-y-1 text-sm">
                              {task.evaluation.mistakes.map((m, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span>•</span>
                                  <span>{m}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!task.evaluation.isCorrect && (
                          <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="sm" onClick={() => handleRetakeTask(task)}>Retake</Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {task.type === 'upload-pdf' && (
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => openFilePicker(task.id)}
                      disabled={task.completed}
                    >
                      Upload PDF
                    </Button>
                    <input
                      id={`file-input-${task.id}`}
                      className="hidden"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleTaskAnswer(task.id, e.target.files?.[0] || null)}
                      disabled={task.completed}
                    />
                    {!task.completed && (
                      <div className="text-sm text-muted-foreground">
                        {((taskAnswers[task.id] as File | undefined)?.name
                          ? <>Selected: {(taskAnswers[task.id] as File).name}</>
                          : <>No file selected</>)}
                      </div>
                    )}
                    {submitting[task.id] && (
                      <div className="text-sm text-muted-foreground">Validating PDF...</div>
                    )}
                    {task.completed && task.userFileName && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                        <p className="text-sm">
                          <strong>Uploaded file:</strong> {task.userFileName}
                        </p>
                      </div>
                    )}
                    {task.evaluation && (
                      <>
                        <div className={'p-3 border rounded'}
                          style={task.evaluation.isCorrect ? { backgroundColor: '#ecfdf5', borderColor: '#86efac' } : { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }}>
                          {typeof task.evaluation.score === 'number' && (
                            <p className={'text-sm font-medium'}
                              style={task.evaluation.isCorrect ? { color: '#065f46' } : { color: '#991b1b' }}>
                              Score: {Math.round(task.evaluation.score * 100)}%
                            </p>
                          )}
                        </div>
                        {!task.evaluation.isCorrect && (
                          <div className="p-3 border rounded">
                            <div className="text-sm font-medium">Feedback:</div>
                            <div className="mt-2 space-y-1 text-sm">
                              {task.evaluation.mistakes.map((m, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span>•</span>
                                  <span>{m}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!task.evaluation.isCorrect && (
                          <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="sm" onClick={() => handleRetakeTask(task)}>Retake</Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {!task.completed && (
                  <Button
                    onClick={() => handleSubmitTask(task)}
                    className="mt-4"
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
              </CardContent>
            </Card>
          ))}

          {course.tasks.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3>No Tasks Available</h3>
                <p className="text-muted-foreground">
                  Tasks are being generated for this chapter. Please check back later.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}