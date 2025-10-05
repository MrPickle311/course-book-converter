import { useState, useEffect, useCallback } from 'react';
import { DefaultService, OpenAPI, type ProcessPdfResponse, type GenerateCourseRequest, type GenerateCourseResponse } from '@/openapi';
import type { NoteBlock } from './types/notes';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ThemeProvider } from './components/ThemeContext';
import { SettingsProvider } from './components/SettingsContext';
import { AuthForm } from './components/AuthForm';
import { UserMenu } from './components/UserMenu';
import { UploadPDF } from './components/UploadPDF';
import { TableOfContents } from './components/TableOfContents';
import { CourseContent } from './components/CourseContent';
import { BooksLibrary } from './components/BooksLibrary';
import { BookDetail } from './components/BookDetail.tsx';
import { Button } from './components/ui/button';
import { ArrowLeft, Library, LogOut } from 'lucide-react';

type AppState = 'upload' | 'toc' | 'course' | 'library' | 'book';

interface Book {
  id: string;
  title: string;
  uploadDate: string;
  tableOfContents: Chapter[];
  lastUsedAt?: string;
}

interface Chapter {
  id: string;
  title: string;
  page: number;
  isGenerated?: boolean;
}

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


function AppContent() {
  // Configure OpenAPI base URL from Vite env (fallback to backend-kotlin default)
  // Vite exposes env via import.meta as any in this template; cast to any to avoid TS error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OpenAPI.BASE = 'http://localhost:8080';
  const { user, isLoading, logout } = useAuth();
  const [appState, setAppState] = useState<AppState>('upload');
  const [books, setBooks] = useState<Book[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [lastContentOrigin, setLastContentOrigin] = useState<'toc' | 'book' | null>(null);

  const headerRef = useCallback((node: HTMLDivElement) => {
    setHeaderHeight(node.getBoundingClientRect().height ?? 0);
  }, []);

  // Load books from API on first login
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await DefaultService.getBooksList({ page: 1, pageSize: 20 });
        const apiBooks = res.data?.items || [];
        const mapped: Book[] = apiBooks.map((b) => ({
          id: b.id || '',
          title: b.title || '',
          uploadDate: b.uploadDate || new Date().toISOString().split('T')[0],
          tableOfContents: [],
          lastUsedAt: b.lastUsedAt || undefined,
        }));
        setBooks(mapped);
        // courses are created when generating a chapter
      } catch (e) {
        console.error('Failed to load books', e);
      }
    })();
  }, [user?.id]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show auth form if user is not logged in
  if (!user) {
    return <AuthForm />;
  }

  const handleFileUpload = async (file: File) => {
    const form = { file } as any;
    const resp: ProcessPdfResponse = await DefaultService.processPdf({ formData: form });
    if (!resp?.success || !resp.data) return;
    const { uploadId, chapters } = resp.data;
    const toc = (chapters || []).map((c, idx) => ({
      id: `${uploadId}-${idx + 1}`,
      title: c.title || `Chapter ${idx + 1}`,
      page: c.startPage ?? (idx * 10 + 1),
    }));
    const newBook: Book = {
      id: uploadId,
      title: file.name.replace('.pdf', ''),
      uploadDate: new Date().toISOString().split('T')[0],
      tableOfContents: toc,
      lastUsedAt: new Date().toISOString()
    };
    setBooks(prev => [newBook, ...prev]);
    setCurrentBook(newBook);
    setAppState('library');
  };

  const handleChapterSelect = (chapter: Chapter) => {
    // Generate course for selected chapter
    const newCourse: Course = {
      id: Date.now().toString(),
      bookId: currentBook!.id,
      bookTitle: currentBook!.title,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      notes: [],
      tasks: [],
      createdDate: new Date().toISOString().split('T')[0],
      completed: false,
      userId: user.id
    };
    
    setCourses(prev => [...prev, newCourse]);
    // bump last used for the book when starting a course
    setBooks(prev => prev.map(b => b.id === currentBook!.id ? { ...b, lastUsedAt: new Date().toISOString() } : b));
    setCurrentCourse(newCourse);
    setAppState('course');
    setLastContentOrigin('toc');
  };

  const handleGenerateCourseForChapter = async (chapterId: string) => {
    if (!currentBook || !user) return;
    const chapter = currentBook.tableOfContents.find(c => c.id === chapterId);
    if (!chapter) return;
    const req: GenerateCourseRequest = {
      chapterId: chapter.id,
      uploadId: currentBook.id
    };
    const gen: GenerateCourseResponse = await DefaultService.generateCourse({ requestBody: req });
    const tasks: Task[] = (gen?.tasks || []).map((t, idx) => ({
      id: `task-${currentBook.id}-${chapter.id}-gen-${idx + 1}`,
      question: t.title || `Task ${idx + 1}`,
      type: 'short-answer',
      expectedKeywords: t.successCriteria,
      completed: false,
    }));
    // Fetch generated MDX notes bundle for this chapter
    let notes: NoteBlock[] = [];
    try {
      const mdxText = await DefaultService.getChapterNotes({ uploadId: currentBook.id, chapterId: chapter.id });
      if (typeof mdxText === 'string' && mdxText.trim().length > 0) {
        notes = [{ type: 'richText', title: gen?.title || chapter.title, markdown: mdxText } as any];
      }
    } catch {
    }
    const newCourse: Course = {
      id: `canonical-${currentBook.id}-${chapter.id}`,
      bookId: currentBook.id,
      bookTitle: currentBook.title,
      chapterId: chapter.id,
      chapterTitle: gen?.title || chapter.title,
      notes,
      tasks,
      createdDate: new Date().toISOString().split('T')[0],
      completed: false,
      userId: user.id
    };
    setCourses(prev => [...prev, newCourse]);
    setBooks(prev => prev.map(b => b.id === currentBook.id ? { ...b, lastUsedAt: new Date().toISOString() } : b));
  };

  const handleBackToTOC = () => {
    setAppState('toc');
  };

  const handleBackToUpload = () => {
    setAppState('upload');
    setCurrentBook(null);
  };

  const handleOpenLibrary = () => {
    setAppState('library');
  };

  const handleSelectCourse = (course: Course) => {
    // bump last used for the corresponding book when opening a course directly
    setBooks(prev => prev.map(b => b.id === course.bookId ? { ...b, lastUsedAt: new Date().toISOString() } : b));
    setCurrentCourse(course);
    setAppState('course');
    setLastContentOrigin('book');
  };

  const handleOpenBook = async (book: Book) => {
    setAppState('book');
    // optimistic open with summary
    setCurrentBook({ ...book, lastUsedAt: new Date().toISOString() });
    // update last used timestamp in list
    setBooks((prev) => prev.map((b) => b.id === book.id ? { ...b, lastUsedAt: new Date().toISOString() } : b));
    try {
      const detail = await DefaultService.getBookById({ uploadId: book.id });
      const data = detail?.data;
      if (data) {
        const toc: Chapter[] = (data.chapters || []).map((t) => ({
          id: t.chapterId || `${book.id}-${t.firstPage ?? 0}`,
          title: t.title || 'Chapter',
          page: t.firstPage ?? 0,
          isGenerated: (t as any).isGenerated ?? false,
        }));
        setCurrentBook({
          id: data.id || book.id,
          title: data.title || book.title,
          uploadDate: data.uploadDate || book.uploadDate,
          tableOfContents: toc,
          lastUsedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      // leave optimistic state if detail fetch fails
      console.error('Failed to fetch book details', e);
    }
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    setCurrentCourse(updatedCourse);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {appState !== 'upload' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (appState === 'toc') handleBackToUpload();
                  else if (appState === 'course') {
                    if (lastContentOrigin === 'book') setAppState('book');
                    else handleBackToTOC();
                  }
                  else if (appState === 'library') setAppState('upload');
                  else if (appState === 'book') setAppState('library');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1>PDF Course Generator</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenLibrary}
            >
              <Library className="w-4 h-4 mr-2" />
              My books
            </Button>
            <UserMenu />
            <Button
              variant="destructive"
              size="sm"
              onClick={logout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8" style={{ paddingTop: headerHeight + 10}}>
        {appState === 'upload' && (
          <UploadPDF 
            onFileUpload={handleFileUpload} 
            userCourses={courses.filter(course => course.userId === user.id)}
          />
        )}
        
        {appState === 'toc' && currentBook && (
          <TableOfContents
            book={currentBook}
            onChapterSelect={handleChapterSelect}
          />
        )}
        
        {appState === 'course' && currentCourse && (
          <CourseContent
            course={currentCourse}
            onUpdateCourse={handleUpdateCourse}
          />
        )}
        
        {appState === 'library' && (
          <BooksLibrary
            books={books}
            courses={courses.filter(course => course.userId === user.id)}
            onOpenBook={handleOpenBook}
          />
        )}

        {appState === 'book' && currentBook && (
          <BookDetail
            book={currentBook}
            courses={courses.filter(course => course.userId === user.id)}
            onSelectCourse={handleSelectCourse}
            onGenerateCourse={handleGenerateCourseForChapter}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}