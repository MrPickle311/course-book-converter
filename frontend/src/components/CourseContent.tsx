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

interface Course {
  id: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  notes: string;
  tasks: Task[];
  createdDate: string;
  completed: boolean;
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

  const formatNotes = (notes: string) => {
    // Simple markdown-like formatting
    return notes
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="mb-4 mt-6">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="mb-3 mt-5">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="mb-2 mt-4">{line.slice(4)}</h3>;
        }
        if (line.startsWith('```')) {
          return null; // Handle code blocks separately
        }
        if (line.match(/^\d+\./)) {
          return <li key={index} className="ml-4">{line}</li>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-4 list-disc">{line.slice(2)}</li>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="mb-2">{line}</p>;
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
              <div className="space-y-4">
                {formatNotes(course.notes)}
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
                      onValueChange={(value) => handleTaskAnswer(task.id, value)}
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