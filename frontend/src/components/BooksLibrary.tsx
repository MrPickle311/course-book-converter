import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { BookOpen, CheckCircle, ChevronRight, Search, Trophy, Clock } from 'lucide-react';
import { useSettings } from './SettingsContext';
import type {Course} from "@/components/CourseContent.tsx";
import type {BookDetail} from "@/openapi";
import { Tabs } from 'antd';

interface LibraryMetricsUI {
  totalBooks: number;
  completedBooks: number;
  inProgressBooks: number;
  failedTasks: number;
  totalTasks: number;
  completedTasks: number;
  overallProgress: number; // 0..1
}

interface BooksLibraryProps {
  books: BookDetail[];
  courses: Course[];
  onOpenBook: (book: BookDetail) => void;
  metrics?: LibraryMetricsUI;
}

export function BooksLibrary({ books, courses, onOpenBook, metrics }: BooksLibraryProps) {
  const { pageSize } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'all' | 'in-progress' | 'completed'>('all');

  const bookStats = useMemo(() => {
    const map = new Map<string, {
      totalCourses: number; // unique generated chapters
      completedCourses: number; // representative completed courses
      totalTasks: number; // tasks across unique representatives
      completedTasks: number;
      failedTasks: number;
      isCompleted: boolean;
      isInProgress: boolean;
    }>();
    books.forEach((book) => {
      // Prefer backend-provided summary progress if present on the item
      const pd = (book as any)?.progressData as { tasksCount?: number; tasksCompleted?: number; tasksFailed?: number } | undefined;
      if (pd && typeof pd.tasksCount === 'number') {
        const totalCoursesFromBackend = Number(((book as any)?.generatedCoursesCount) || 0);
        const totalTasks = Number(pd.tasksCount || 0);
        const completedTasks = Number(pd.tasksCompleted || 0);
        const failedTasks = Number(pd.tasksFailed || 0);
        const isCompleted = totalTasks > 0 && completedTasks === totalTasks && failedTasks === 0;
        const isInProgress = totalTasks > 0 && !isCompleted && (completedTasks > 0 || failedTasks > 0);
        map.set(book.id, { totalCourses: totalCoursesFromBackend, completedCourses: 0, totalTasks, completedTasks, failedTasks, isCompleted, isInProgress });
        return;
      }

      // Fallback: approximate from in-memory courses
      const bookCourses = courses.filter((c) => c.bookId === book.id);
      const groups = new Map<string, typeof bookCourses>();
      bookCourses.forEach((c) => {
        const baseId = c.chapterId.split('-p')[0];
        const list = groups.get(baseId) || [];
        list.push(c);
        groups.set(baseId, list);
      });
      const representatives = Array.from(groups.values()).map((list) => list[0]);
      const totalCourses = representatives.length;
      const completedCourses = representatives.filter((c) => c.completed).length;
      const totalTasks = representatives.reduce((acc, c) => acc + c.tasks.length, 0);
      const completedTasks = representatives.reduce((acc, c) => acc + c.tasks.filter((t: any) => t.completed).length, 0);
      const failedTasks = representatives.reduce((acc, c) => acc + c.tasks.filter((t: any) => t.completed && t.evaluation?.isCorrect === false).length, 0);
      const isCompleted = totalCourses > 0 && totalTasks > 0 && completedTasks === totalTasks && failedTasks === 0;
      const isInProgress = totalCourses > 0 && ((completedTasks > 0 && completedTasks < totalTasks) || failedTasks > 0);
      map.set(book.id, { totalCourses, completedCourses, totalTasks, completedTasks, failedTasks, isCompleted, isInProgress });
    });
    return map;
  }, [books, courses]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const base = books.filter((b) => {
      const stats = bookStats.get(b.id);
      const matches = b.title.toLowerCase().includes(q);
      if (activeView === 'completed') {
          return matches && !!stats?.isCompleted;
      }
      if (activeView === 'in-progress') {
          return matches && !!stats?.isInProgress;
      }
      return matches;
    });
    // sort by lastUsedAt desc, fallback to uploadDate desc
    const getLastUsed = (book: BookDetail) => {
      const lastUsed = (book as any)?.lastUsedAt;
      return typeof lastUsed === 'string' ? lastUsed : book.uploadDate;
    };
    return base.slice().sort((a, b) => {
      const aTime = Date.parse(getLastUsed(a));
      const bTime = Date.parse(getLastUsed(b));
      return bTime - aTime;
    });
  }, [books, bookStats, searchQuery, activeView]);

  const BOOKS_PER_PAGE = pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / BOOKS_PER_PAGE));
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const stats = useMemo(() => {
    if (metrics) {
      return {
        total: metrics.totalBooks,
        completed: metrics.completedBooks,
        inProgress: metrics.inProgressBooks,
        totalTasks: metrics.totalTasks,
        completedTasks: metrics.completedTasks,
        failedTasks: metrics.failedTasks,
        overallProgressPct: Math.round((metrics.overallProgress || 0) * 100),
      };
    }
    const total = filteredBooks.length;
    const completed = filteredBooks.filter((b) => bookStats.get(b.id)?.isCompleted).length;
    const inProgress = filteredBooks.filter((b) => bookStats.get(b.id)?.isInProgress).length;
    const totalTasks = courses.reduce((acc, c) => acc + c.tasks.length, 0);
    const completedTasks = courses.reduce((acc, c) => acc + c.tasks.filter((t: any) => t.completed).length, 0);
    const failedTasks = courses.reduce((acc, c) => acc + c.tasks.filter((t: any) => t.completed && t.evaluation?.isCorrect === false).length, 0);
    const overall = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { total, completed, inProgress, totalTasks, completedTasks, failedTasks, overallProgressPct: overall };
  }, [metrics, filteredBooks, bookStats, courses]);

  const overallProgress = stats.overallProgressPct;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2>My Books</h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search books by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Books</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-semibold text-orange-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Tasks</p>
                <p className="text-2xl font-semibold text-red-600">{stats.failedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-semibold">{Math.round(overallProgress)}%</p>
              </div>
              <Trophy className="w-8 h-8 text-purple-500" />
            </div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs
        className="bcc-tabs bcc-tabs--pill"
        itemColor="white"
        activeKey={activeView}
        onChange={(key) => setActiveView(key as 'all' | 'in-progress' | 'completed')}
        items={[
          { key: 'all', label: `All Books (${stats.total})` },
          { key: 'in-progress', label: `In Progress (${stats.inProgress})` },
          { key: 'completed', label: `Completed (${stats.completed})` },
        ]}
      />

      <div className="mt-6">
          {filteredBooks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3>No books found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No books match your search criteria.' : 'Start by uploading a PDF book to create your first course.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {filteredBooks
                .slice((page - 1) * BOOKS_PER_PAGE, page * BOOKS_PER_PAGE)
                .map((book) => {
                  const statsForBook = bookStats.get(book.id)!;
                  const progress = statsForBook.totalTasks > 0 ? (statsForBook.completedTasks / statsForBook.totalTasks) * 100 : 0;
                  return (
                    <Card key={book.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onOpenBook(book)}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{book.title}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {statsForBook.totalCourses} generated course{statsForBook.totalCourses !== 1 ? 's' : ''} • Uploaded {new Date(book.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={statsForBook.isCompleted ? 'default' : (statsForBook.isInProgress ? 'secondary' : 'outline')} className="text-xs">
                              {statsForBook.isCompleted ? 'Completed' : statsForBook.isInProgress ? 'In Progress' : 'Not Started'}
                            </Badge>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>{statsForBook.completedTasks}/{statsForBook.totalTasks} tasks</span>
                          </div>
                          {statsForBook.failedTasks > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <span>• {statsForBook.failedTasks} failed</span>
                            </div>
                          )}
                        </div>
                        <Progress value={progress} className="flex-1 h-2" showInfo />
                      </CardContent>
                    </Card>
                  );
                })}

              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" size="default" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <PaginationItem key={idx}>
                        <PaginationLink href="#" size="default" isActive={page === idx + 1} onClick={(e) => { e.preventDefault(); setPage(idx + 1); }}>
                          {idx + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext href="#" size="default" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
      </div>
    </div>
  );
}


