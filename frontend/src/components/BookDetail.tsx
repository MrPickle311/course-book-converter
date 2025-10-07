import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar, CheckCircle, ChevronRight, BookOpen, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { type BookDetail, type Chapter, DefaultService } from '@/openapi';

export interface BookDetailProps {
  book: BookDetail;
  onGenerateCourse?: (chapterId: string) => Promise<void> | void;
  onOpenGeneratedCourse?: (chapterId: string) => Promise<void> | void;
}

export function BookDetail({ book, onGenerateCourse, onOpenGeneratedCourse }: BookDetailProps) {
  const stats = useMemo(() => {
    const chapters: Chapter[] = book.chapters || [];
    const generated = chapters.filter((ch) => ch.isGenerated);
    const generatedChaptersCount = generated.length;
    const totalTasks = chapters.reduce((acc, ch) => acc + (ch.progressData?.tasksCount || 0), 0);
    const completedTasks = chapters.reduce((acc, ch) => acc + (ch.progressData?.tasksCompleted || 0), 0);
    const failedTasks = chapters.reduce((acc, ch) => acc + (ch.progressData?.tasksFailed || 0), 0);
    const completedCourses = generated.filter((ch) => (ch.progressData?.tasksCount || 0) > 0 && ch.progressData?.tasksCompleted === ch.progressData?.tasksCount).length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    return { generatedChaptersCount, completedCourses, totalTasks, completedTasks, failedTasks, progress };
  }, [book.id, book.chapters]);

  const [generating, setGenerating] = useState<Set<string>>(new Set());

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
            <div className="ml-auto">
              <Button variant="destructive" size="sm" onClick={async () => {
                try {
                  await DefaultService.deleteBook({ uploadId: book.id });
                  window.location.href = '/';
                } catch (e) {
                  console.error('Failed to delete book', e);
                }
              }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete book
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-sm text-muted-foreground">Generated courses: <span className="text-foreground font-medium">{stats.generatedChaptersCount}</span></div>
            <div className="text-sm text-muted-foreground">Completed: <span className="text-foreground font-medium">{stats.completedCourses}</span></div>
            <div className="text-sm text-muted-foreground">Tasks: <span className="text-foreground font-medium">{stats.completedTasks}/{stats.totalTasks}</span>{stats.failedTasks > 0 && <span className="text-red-600"> • {stats.failedTasks} failed</span>}</div>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={stats.progress} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground min-w-0">{Math.round(stats.progress)}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {book.chapters.map((chapter) => {
          if (!chapter.isGenerated) {
            const isBusy = generating.has(chapter.chapterId);
            return (
              <Card key={chapter.chapterId}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{chapter.title}</h4>
                    </div>
                    <div className="text-xs text-muted-foreground">Page {chapter.startPage}</div>
                  </div>
                  <Button onClick={async () => {
                    if (!onGenerateCourse || isBusy) {
                        return;
                    }
                    setGenerating(prev => new Set(prev).add(chapter.chapterId));
                    await onGenerateCourse(chapter.chapterId);
                    setGenerating(prev => { const next = new Set(prev); next.delete(chapter.chapterId); return next; });
                  }} size="sm" disabled={isBusy}>{isBusy ? 'Generating…' : 'Generate course'}</Button>
                </CardContent>
              </Card>
            );
          }

            const tasksCount = chapter.progressData?.tasksCount || 0;
            const completedTasks = chapter.progressData?.tasksCompleted || 0;
            const progress = tasksCount > 0 ? (completedTasks / tasksCount) * 100 : 0;
            const isCourseCompleted = tasksCount > 0 && (chapter.progressData?.tasksCompleted === chapter.progressData?.tasksCount);
            return (
                <div
                    key={chapter.chapterId}
                    className="group border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onOpenGeneratedCourse && onOpenGeneratedCourse(chapter.chapterId)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium">{chapter.title}</h4>
                                <Badge
                                    variant={isCourseCompleted ? "default" : "secondary"}
                                    className="text-xs"
                                >
                                    {isCourseCompleted ? "Completed" : "In Progress"}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Created {new Date(book.uploadDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>{completedTasks}/{tasksCount} tasks</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Progress value={progress} className="flex-1 h-2" />
                                <span className="text-xs text-muted-foreground min-w-0">
                                    {Math.round(progress)}%
                                  </span>
                            </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}


