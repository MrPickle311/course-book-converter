import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { CheckCircle, Circle, BookOpen, CheckSquare, Clock, Award, Loader2 } from 'lucide-react';

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

import type { NoteBlock } from '../mocks/Mock';

interface Course {
  id: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  notes: NoteBlock[];
  tasks: Task[];
  createdDate: string;
  completed: boolean;
  userId: string;
}

interface CourseContentProps {
  course: Course;
  onUpdateCourse: (course: Course) => void;
}

export function CourseContent({ course, onUpdateCourse }: CourseContentProps) {
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
        completed: updatedTasks.every(t => t.completed)
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
            explanation: 'Ensure the uploaded PDF relates to the chapter and is clearly named.'
          },
          completed: true,
        } as Task;
        const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
        const updatedCourse = {
          ...course,
          tasks: updatedTasks,
          completed: updatedTasks.every(t => t.completed)
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
          completed: updatedTasks.every(t => t.completed)
        };
        onUpdateCourse(updatedCourse);
        setSubmitting(prev => ({ ...prev, [task.id]: false }));
      }, 1000);
      return;
    }

    const updatedTask = {
      ...task,
      userAnswer,
      completed: true
    } as Task;

    const updatedTasks = course.tasks.map(t => t.id === task.id ? updatedTask : t);
    const updatedCourse = {
      ...course,
      tasks: updatedTasks,
      completed: updatedTasks.every(t => t.completed)
    };

    onUpdateCourse(updatedCourse);
  };

  const renderBlocks = (blocks: NoteBlock[]) => {
    return blocks.map((block, index) => {
      if (block.type === 'richText') {
        return (
          <div key={index} className="space-y-2">
            {block.title && <h3 className="mt-2">{block.title}</h3>}
            {/* basic markdown handling for headings, lists, paragraphs */}
            {block.markdown.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i} className="mb-4 mt-6">{line.slice(2)}</h1>;
              if (line.startsWith('## ')) return <h2 key={i} className="mb-3 mt-5">{line.slice(3)}</h2>;
              if (line.startsWith('### ')) return <h3 key={i} className="mb-2 mt-4">{line.slice(4)}</h3>;
              if (/^\d+\./.test(line)) return <li key={i} className="ml-4">{line}</li>;
              if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} className="mb-2">{line}</p>;
            })}
          </div>
        );
      }
      if (block.type === 'table') {
        return (
          <div key={index} className="overflow-x-auto">
            {block.title && <h3 className="mt-4 mb-2">{block.title}</h3>}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {block.headers.map((h, hi) => (
                    <th key={hi} className="border p-2 text-left bg-muted/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="border p-2 align-top">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      if (block.type === 'code') {
        return (
          <div key={index} className="mt-4">
            {block.title && <h3 className="mb-2">{block.title}</h3>}
            <pre className="p-3 bg-muted rounded text-sm overflow-x-auto"><code>{block.code}</code></pre>
          </div>
        );
      }
      if (block.type === 'figure') {
        return (
          <div key={index} className="mt-4 text-center">
            <img src={`src/mocks/${block.src}`} alt={block.caption || 'Figure'} className="mx-auto max-h-96 rounded border" />
            {block.caption && <div className="text-xs text-muted-foreground mt-2">{block.caption}</div>}
          </div>
        );
      }
      return null;
    });
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
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Notes</span>
                </div>
                <p className="text-xs text-muted-foreground">Study material ready</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <CheckSquare className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{completedTasks} Tasks Done</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {course.tasks.length - completedTasks} remaining
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">~30 min</span>
                </div>
                <p className="text-xs text-muted-foreground">Estimated time</p>
              </div>
            </div>
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
            <CardHeader>
              <CardTitle>Study Notes</CardTitle>
            </CardHeader>
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
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm mt-1">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base">{task.question}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {task.type.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  {submitting[task.id] ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : task.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {task.type === 'multiple-choice' && task.options && (
                  <div className="space-y-4">
                    <RadioGroup
                      value={(taskAnswers[task.id] as string) || ''}
                      onValueChange={(value: string) => handleTaskAnswer(task.id, value)}
                      disabled={task.completed}
                    >
                      {task.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${task.id}-${optionIndex}`} />
                          <Label htmlFor={`${task.id}-${optionIndex}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {task.completed && task.userAnswer && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm">
                          <strong>Your answer:</strong> {task.userAnswer}
                          {task.userAnswer === task.correctAnswer ? (
                            <span className="text-green-600 ml-2">✓ Correct!</span>
                          ) : (
                            <span className="text-red-600 ml-2">
                              ✗ Correct answer: {task.correctAnswer}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {task.type === 'multiple-select' && task.options && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {task.options.map((option, optionIndex) => {
                        const selected = ((taskAnswers[task.id] as string[]) || []).includes(option);
                        return (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${task.id}-ms-${optionIndex}`}
                              checked={selected}
                              onCheckedChange={() => toggleMultiSelectOption(task.id, option)}
                              disabled={task.completed}
                            />
                            <Label htmlFor={`${task.id}-ms-${optionIndex}`}>{option}</Label>
                          </div>
                        );
                      })}
                    </div>
                    {task.completed && task.userAnswers && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm">
                          <strong>Your answers:</strong> {task.userAnswers.join(', ')}
                          {task.correctAnswers && (
                            <span className="ml-2">
                              {Array.isArray(task.correctAnswers)
                                ? `Correct: ${task.correctAnswers.join(', ')}`
                                : null}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {task.evaluation && (
                      <div className={(task.evaluation.isCorrect ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200') + ' p-3 border rounded'}>
                        <p className="text-sm">
                          <strong>Result:</strong> {task.evaluation.isCorrect ? 'Correct' : 'Needs review'}
                          {typeof task.evaluation.score === 'number' && (
                            <span className="ml-2">Score: {Math.round(task.evaluation.score * 100)}%</span>
                          )}
                        </p>
                        {task.evaluation.explanation && (
                          <p className="text-sm mt-1">{task.evaluation.explanation}</p>
                        )}
                        {task.evaluation.mistakes.length > 0 && (
                          <ul className="list-disc ml-5 mt-2 text-sm">
                            {task.evaluation.mistakes.map((m, idx) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(task.type === 'short-answer' || task.type === 'code') && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder={task.type === 'code' ? 'Write your code here...' : 'Enter your answer...'}
                      value={(taskAnswers[task.id] as string) || ''}
                      onChange={(e) => handleTaskAnswer(task.id, e.target.value)}
                      disabled={task.completed}
                      className={task.type === 'code' ? 'font-mono' : ''}
                      rows={task.type === 'code' ? 8 : 4}
                    />
                    {submitting[task.id] && (
                      <div className="text-sm text-muted-foreground">Evaluating answer...</div>
                    )}
                    {task.completed && task.userAnswer && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm">
                          <strong>Your answer:</strong>
                        </p>
                        <pre className="mt-2 text-sm whitespace-pre-wrap">{task.userAnswer}</pre>
                      </div>
                    )}
                    {task.completed && task.feedback && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                        <p className="text-sm">
                          <strong>Feedback:</strong> {task.feedback}
                        </p>
                      </div>
                    )}
                    {task.evaluation && (
                      <div className={(task.evaluation.isCorrect ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200') + ' p-3 border rounded'}>
                        <p className="text-sm">
                          <strong>Result:</strong> {task.evaluation.isCorrect ? 'Correct' : 'Needs improvement'}
                          {typeof task.evaluation.score === 'number' && (
                            <span className="ml-2">Score: {Math.round(task.evaluation.score * 100)}%</span>
                          )}
                        </p>
                        {task.evaluation.explanation && (
                          <p className="text-sm mt-1">{task.evaluation.explanation}</p>
                        )}
                        {task.evaluation.mistakes.length > 0 && (
                          <ul className="list-disc ml-5 mt-2 text-sm">
                            {task.evaluation.mistakes.map((m, idx) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        )}
                      </div>
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
                    <div className="text-sm text-muted-foreground">
                      {task.completed && task.userFileName
                        ? <>Uploaded file: {task.userFileName}</>
                        : ((taskAnswers[task.id] as File | undefined)?.name
                            ? <>Selected: {(taskAnswers[task.id] as File).name}</>
                            : <>No file selected</>)}
                    </div>
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
                    {task.completed && task.feedback && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                        <p className="text-sm">
                          <strong>Feedback:</strong> {task.feedback}
                        </p>
                      </div>
                    )}
                    {task.evaluation && (
                      <div className={(task.evaluation.isCorrect ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200') + ' p-3 border rounded'}>
                        <p className="text-sm">
                          <strong>Result:</strong> {task.evaluation.isCorrect ? 'Accepted' : 'Issues found'}
                        </p>
                        {task.evaluation.explanation && (
                          <p className="text-sm mt-1">{task.evaluation.explanation}</p>
                        )}
                        {task.evaluation.mistakes.length > 0 && (
                          <ul className="list-disc ml-5 mt-2 text-sm">
                            {task.evaluation.mistakes.map((m, idx) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        )}
                      </div>
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