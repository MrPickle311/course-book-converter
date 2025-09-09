import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { BookOpen, Calendar, CheckCircle, ChevronRight, Filter, Search, Trophy, Clock } from 'lucide-react';
import { useSettings } from './SettingsContext';

interface Book {
  id: string;
  title: string;
  uploadDate: string;
  tableOfContents: any[];
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

interface BooksLibraryProps {
  books: Book[];
  courses: Course[];
  onOpenBook: (book: Book) => void;
}

export function BooksLibrary({ books, courses, onOpenBook }: BooksLibraryProps) {
  const { pageSize } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'all' | 'in-progress' | 'completed'>('all');

  const bookStats = useMemo(() => {
    const map = new Map<string, {
      totalCourses: number;
      completedCourses: number;
      totalTasks: number;
      completedTasks: number;
      isCompleted: boolean;
      isInProgress: boolean;
    }>();
    books.forEach((book) => {
      const bookCourses = courses.filter((c) => c.bookId === book.id);
      const totalCourses = bookCourses.length;
      const completedCourses = bookCourses.filter((c) => c.completed).length;
      const totalTasks = bookCourses.reduce((acc, c) => acc + c.tasks.length, 0);
      const completedTasks = bookCourses.reduce((acc, c) => acc + c.tasks.filter((t: any) => t.completed).length, 0);
      const isCompleted = totalCourses > 0 && completedCourses === totalCourses && totalTasks > 0 && completedTasks === totalTasks;
      const isInProgress = totalCourses > 0 && !isCompleted && (completedTasks > 0 || completedCourses > 0);
      map.set(book.id, { totalCourses, completedCourses, totalTasks, completedTasks, isCompleted, isInProgress });
    });
    return map;
  }, [books, courses]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return books.filter((b) => {
      const stats = bookStats.get(b.id);
      const matches = b.title.toLowerCase().includes(q);
      if (activeView === 'completed') return matches && !!stats?.isCompleted;
      if (activeView === 'in-progress') return matches && !!stats?.isInProgress;
      return matches;
    });
  }, [books, bookStats, searchQuery, activeView]);

  const BOOKS_PER_PAGE = pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / BOOKS_PER_PAGE));
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const stats = {
    total: filteredBooks.length,
    completed: filteredBooks.filter((b) => bookStats.get(b.id)?.isCompleted).length,
    inProgress: filteredBooks.filter((b) => bookStats.get(b.id)?.isInProgress).length,
    totalTasks: courses.reduce((acc, c) => acc + c.tasks.length, 0),
    completedTasks: courses.reduce((acc, c) => acc + c.tasks.filter((t: any) => t.completed).length, 0)
  };

  const overallProgress = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2>My Courses</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{filteredBooks.length} books</span>
          </div>
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
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-semibold">{Math.round(overallProgress)}%</p>
              </div>
              <Trophy className="w-8 h-8 text-purple-500" />
            </div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All Books ({stats.total})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeView} className="mt-6">
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
                                {statsForBook.totalCourses} course{statsForBook.totalCourses !== 1 ? 's' : ''} • Uploaded {new Date(book.uploadDate).toLocaleDateString()}
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
                            <Calendar className="w-4 h-4" />
                            <span>Uploaded {new Date(book.uploadDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>{statsForBook.completedTasks}/{statsForBook.totalTasks} tasks</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="flex-1 h-2" />
                          <span className="text-xs text-muted-foreground min-w-0">{Math.round(progress)}%</span>
                        </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}


