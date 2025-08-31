import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { CheckCircle, Circle, BookOpen, CheckSquare, Clock, Award } from 'lucide-react';

interface Task {
  id: string;
  question: string;
  type: 'multiple-choice' | 'short-answer' | 'code';
  options?: string[];
  correctAnswer?: string;
  userAnswer?: string;
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
  const [taskAnswers, setTaskAnswers] = useState<Record<string, string>>({});

  const completedTasks = course.tasks.filter(task => task.completed).length;
  const progressPercentage = course.tasks.length > 0 ? (completedTasks / course.tasks.length) * 100 : 0;

  const handleTaskAnswer = (taskId: string, answer: string) => {
    setTaskAnswers(prev => ({ ...prev, [taskId]: answer }));
  };

  const handleSubmitTask = (task: Task) => {
    const userAnswer = taskAnswers[task.id];
    if (!userAnswer) return;

    const updatedTask = {
      ...task,
      userAnswer,
      completed: true
    };

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
                  {task.completed ? (
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
                      value={taskAnswers[task.id] || ''}
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

                {(task.type === 'short-answer' || task.type === 'code') && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder={task.type === 'code' ? 'Write your code here...' : 'Enter your answer...'}
                      value={taskAnswers[task.id] || ''}
                      onChange={(e) => handleTaskAnswer(task.id, e.target.value)}
                      disabled={task.completed}
                      className={task.type === 'code' ? 'font-mono' : ''}
                      rows={task.type === 'code' ? 8 : 4}
                    />
                    {task.completed && task.userAnswer && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm">
                          <strong>Your answer:</strong>
                        </p>
                        <pre className="mt-2 text-sm whitespace-pre-wrap">{task.userAnswer}</pre>
                      </div>
                    )}
                  </div>
                )}

                {!task.completed && taskAnswers[task.id] && (
                  <Button
                    onClick={() => handleSubmitTask(task)}
                    className="mt-4"
                  >
                    Submit Answer
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