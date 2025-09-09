import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar, CheckCircle, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from './ui/button';

interface Book {
  id: string;
  title: string;
  uploadDate: string;
  tableOfContents: Array<{ id: string; title: string; page: number }>;
}

interface Course {
  id: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  notes: any;
  tasks: any[];
  createdDate: string;
  completed: boolean;
  userId: string;
}

interface BookDetailProps {
  book: Book;
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onGenerateCourse?: (chapterId: string) => Promise<void> | void;
}

export function BookDetail({ book, courses, onSelectCourse, onGenerateCourse }: BookDetailProps) {
  const stats = useMemo(() => {
    const bookCourses = courses.filter((c) => c.bookId === book.id);
    // Unique generated chapters count (treat chapterId with suffix "-pX" as the same base chapter)
    const generatedChapterIds = new Set<string>(
      bookCourses.map((c) => c.chapterId.split('-p')[0])
    );
    const generatedChaptersCount = generatedChapterIds.size;
    const completedCourses = bookCourses.filter((c) => c.completed).length;
    const totalTasks = bookCourses.reduce((acc, c) => acc + c.tasks.length, 0);
    const completedTasks = bookCourses.reduce((acc, c) => acc + c.tasks.filter((t: any) => t.completed).length, 0);
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    return { bookCourses, generatedChaptersCount, completedCourses, totalTasks, completedTasks, progress };
  }, [book.id, courses]);

  const [generating, setGenerating] = useState<Set<string>>(new Set());

  const findRepresentativeCourse = (chapterId: string): Course | undefined =>
    stats.bookCourses.find((c) => c.chapterId === chapterId || c.chapterId.startsWith(`${chapterId}-`));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{book.title}</CardTitle>
              <p className="text-sm text-muted-foreground">Uploaded {new Date(book.uploadDate).toLocaleDateString()}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-sm text-muted-foreground">Generated courses: <span className="text-foreground font-medium">{stats.generatedChaptersCount}</span></div>
            <div className="text-sm text-muted-foreground">Completed: <span className="text-foreground font-medium">{stats.completedCourses}</span></div>
            <div className="text-sm text-muted-foreground">Tasks: <span className="text-foreground font-medium">{stats.completedTasks}/{stats.totalTasks}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={stats.progress} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground min-w-0">{Math.round(stats.progress)}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {book.tableOfContents.map((chapter) => {
          const course = findRepresentativeCourse(chapter.id);
          if (!course) {
            const isBusy = generating.has(chapter.id);
            return (
              <Card key={chapter.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{chapter.title}</h4>
                    </div>
                    <div className="text-xs text-muted-foreground">Page {chapter.page}</div>
                  </div>
                  <Button onClick={async () => {
                    if (!onGenerateCourse || isBusy) return;
                    setGenerating(prev => new Set(prev).add(chapter.id));
                    await onGenerateCourse(chapter.id);
                    setGenerating(prev => { const next = new Set(prev); next.delete(chapter.id); return next; });
                  }} size="sm" disabled={isBusy}>{isBusy ? 'Generating…' : 'Generate course'}</Button>
                </CardContent>
              </Card>
            );
          }
          const completedTasks = course.tasks.filter((t: any) => t.completed).length;
          const progress = course.tasks.length > 0 ? (completedTasks / course.tasks.length) * 100 : 0;
          return (
            <Card key={chapter.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onSelectCourse(course)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{course.chapterTitle}</h4>
                      <Badge variant={course.completed ? 'default' : 'secondary'} className="text-xs">
                        {course.completed ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Created {new Date(course.createdDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{completedTasks}/{course.tasks.length} tasks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground min-w-0">{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


