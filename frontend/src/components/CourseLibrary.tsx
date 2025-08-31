import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  BookOpen, 
  Search, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Trophy,
  Filter,
  ChevronRight,
  MoreHorizontal 
} from 'lucide-react';

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

interface CourseLibraryProps {
  books: Book[];
  courses: Course[];
  onSelectCourse: (course: Course) => void;
}

export function CourseLibrary({ books, courses, onSelectCourse }: CourseLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('all');

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.bookTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeView === 'completed') return matchesSearch && course.completed;
    if (activeView === 'in-progress') return matchesSearch && !course.completed;
    return matchesSearch;
  });

  const groupedCourses = books.map(book => ({
    book,
    courses: filteredCourses.filter(course => course.bookId === book.id)
  })).filter(group => group.courses.length > 0);

  const stats = {
    total: courses.length,
    completed: courses.filter(c => c.completed).length,
    inProgress: courses.filter(c => !c.completed).length,
    totalTasks: courses.reduce((acc, course) => acc + course.tasks.length, 0),
    completedTasks: courses.reduce((acc, course) => 
      acc + course.tasks.filter(task => task.completed).length, 0
    )
  };

  const overallProgress = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2>My Course Library</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {filteredCourses.length} courses
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses by title or book..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
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

      {/* Filter Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          <TabsTrigger value="all">All Courses ({stats.total})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeView} className="mt-6">
          {groupedCourses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3>No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No courses match your search criteria.' : 'Start by uploading a PDF book to create your first course.'}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {groupedCourses.map(({ book, courses }) => (
                <Card key={book.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{book.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {courses.length} course{courses.length !== 1 ? 's' : ''} • 
                            Uploaded {new Date(book.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {courses.map((course) => {
                      const completedTasks = course.tasks.filter(task => task.completed).length;
                      const progress = course.tasks.length > 0 ? (completedTasks / course.tasks.length) * 100 : 0;
                      
                      return (
                        <div
                          key={course.id}
                          className="group border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => onSelectCourse(course)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{course.chapterTitle}</h4>
                                <Badge 
                                  variant={course.completed ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {course.completed ? "Completed" : "In Progress"}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}