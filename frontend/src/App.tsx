import { useState, useEffect, useCallback, useRef } from 'react';
import { DefaultService, OpenAPI, type ProcessPdfResponse, type GenerateCourseRequest, type BookDetail as ApiBookDetail, type Chapter as ApiChapter } from '@/openapi';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { SettingsProvider } from './components/SettingsContext';
import { AuthForm } from './components/AuthForm';
import { UserMenu } from './components/UserMenu';
import { UploadPDF } from './components/UploadPDF';
import {type Course, CourseContent} from './components/CourseContent';
import { BooksLibrary } from './components/BooksLibrary';
import { BookDetail } from './components/BookDetail.tsx';
import { Button } from './components/ui/button';
import { ArrowLeft, Library, LogOut } from 'lucide-react';
import { ConfigProvider, Flex, theme as antdTheme } from 'antd';

type AppState = 'upload' | 'toc' | 'course' | 'library' | 'book';

type Book = ApiBookDetail;
type Chapter = ApiChapter;

function AppContent() {
  // Configure OpenAPI base URL from Vite env (fallback to backend-kotlin default)
  // Vite exposes env via import.meta as any in this template; cast to any to avoid TS error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OpenAPI.BASE = 'http://localhost:8080';
  // Allow backend endpoints that return text (MDX notes) to negotiate properly
  OpenAPI.HEADERS = {
    Accept: 'application/json, text/plain, text/markdown, */*',
  } as any;
  const { user, isLoading, logout } = useAuth();
  const [appState, setAppState] = useState<AppState>('upload');
  const [books, setBooks] = useState<Book[]>([]);
  const [libraryMetrics, setLibraryMetrics] = useState<{
    totalBooks: number;
    completedBooks: number;
    inProgressBooks: number;
    failedTasks: number;
    totalTasks: number;
    completedTasks: number;
    overallProgress: number; // 0..1
  } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [lastContentOrigin, setLastContentOrigin] = useState<'toc' | 'book' | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const pollingStopTimeoutRef = useRef<number | null>(null);

  const headerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setHeaderHeight(node.getBoundingClientRect().height ?? 0);
    }
  }, []);

  const refreshBooks = useCallback(async () => {
      try {
        const res = await DefaultService.getBooksList({ page: 1, pageSize: 20 });
      // openapi typing may lag behind spec; use any to safely access metrics
      const dataAny: any = (res as any)?.data ?? (res as any)?.data;
      const apiBooks = (dataAny?.items || []) as Array<any>;
      const mapped: Book[] = apiBooks.map((raw: any) => ({
        id: raw.id || '',
        title: raw.title || '',
        uploadDate: raw.uploadDate || new Date().toISOString().split('T')[0],
        // Keep optional fields from summary so UI can sort and show per-book progress
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lastUsedAt: (raw as any).lastUsedAt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progressData: (raw as any).progressData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        generatedCoursesCount: (raw as any).generatedCoursesCount,
        chapters: [],
      } as unknown as Book));
        setBooks(mapped);
      const m = dataAny?.metrics;
      if (m) {
        setLibraryMetrics({
          totalBooks: Number(m.totalBooks || 0),
          completedBooks: Number(m.completedBooks || 0),
          inProgressBooks: Number(m.inProgressBooks || 0),
          failedTasks: Number(m.failedTasks || 0),
          totalTasks: Number(m.totalTasks || 0),
          completedTasks: Number(m.completedTasks || 0),
          overallProgress: typeof m.overallProgress === 'number' ? m.overallProgress : 0,
        });
      }
      } catch (e) {
        console.error('Failed to load books', e);
      }
  }, []);

  const startLibraryPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingStopTimeoutRef.current) {
      window.clearTimeout(pollingStopTimeoutRef.current);
      pollingStopTimeoutRef.current = null;
    }
    // Poll every 2s for a short window to catch new books
    pollingIntervalRef.current = window.setInterval(() => {
      refreshBooks();
    }, 2000);
    // Stop polling after 10s
    pollingStopTimeoutRef.current = window.setTimeout(() => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 10000);
  }, [refreshBooks]);

  // Load books from API on first login
  useEffect(() => {
    if (!user) return;
    (async () => {
      await refreshBooks();
    })();
  }, [user?.id]);

  // Stop polling when leaving the library (must be before any early returns)
  useEffect(() => {
    if (appState !== 'library') {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (pollingStopTimeoutRef.current) {
        window.clearTimeout(pollingStopTimeoutRef.current);
        pollingStopTimeoutRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  // Fetch latest details for the currently opened book (chapters + per-chapter progress)
  const refreshCurrentBook = useCallback(async () => {
    try {
      if (!currentBook) return;
      const detail = await DefaultService.getBookById({ uploadId: currentBook.id });
      const data = detail as unknown as Book;
      if (data) {
        setCurrentBook({
          id: data.id || currentBook.id,
          title: data.title || currentBook.title,
          uploadDate: data.uploadDate || currentBook.uploadDate,
          chapters: (data.chapters as Chapter[]) || currentBook.chapters,
        } as Book);
      }
    } catch (e) {
      console.error('Failed to refresh book details', e);
    }
  }, [currentBook]);

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
    const newBook: Book = {
      id: uploadId,
      title: file.name.replace('.pdf', ''),
      uploadDate: new Date().toISOString().split('T')[0],
      chapters: (chapters as any) || [],
    } as Book;
    setBooks(prev => [newBook, ...prev]);
    setCurrentBook(newBook);
    // After processing finishes, refresh the library list immediately
    await handleOpenLibrary();
  };

  const handleChapterSelect = (chapter: Chapter) => {
    // In new model, selecting a chapter should trigger generation flow
    handleGenerateCourseForChapter(chapter.chapterId);
  };

  const handleGenerateCourseForChapter = async (chapterId: string) => {
    if (!currentBook || !user) return;
    const chapter = currentBook.chapters.find(c => c.chapterId === chapterId);
    if (!chapter) return;
    const req: GenerateCourseRequest = {
      chapterId: chapter.chapterId,
      uploadId: currentBook.id
    };
    await DefaultService.generateCourse({ requestBody: req });
    try {
      const fresh = await DefaultService.getBookById({ uploadId: currentBook.id });
      const freshBook = fresh as unknown as Book;
      if (freshBook) {
        setCurrentBook({
          id: freshBook.id || currentBook.id,
          title: freshBook.title || currentBook.title,
          uploadDate: freshBook.uploadDate || currentBook.uploadDate,
          chapters: (freshBook.chapters as Chapter[]) || currentBook.chapters,
        } as Book);
        setBooks(prev => prev.map(b => b.id === currentBook.id ? {
          ...b,
          title: freshBook.title || b.title,
          uploadDate: freshBook.uploadDate || b.uploadDate,
          // keep summary fields; details are fetched when opening the book
        } : b));
      }
    } catch {
      // Non-fatal; UI will still have added course, and chapter will flip on next open
    }
  };

  const handleBackToTOC = () => {
      console.log("toc")
    setAppState('toc');
  };

  const handleBackToUpload = () => {
      console.log("upload")
    setAppState('upload');
    setCurrentBook(null);
  };

  const handleOpenLibrary = async () => {
    setAppState('library');
    // Refresh immediately and start a short polling window to catch newly uploaded books
    await refreshBooks();
    startLibraryPolling();
  };


  // removed legacy select course handler in favor of chapter-driven flows

  const handleOpenBook = async (book: Book) => {
      console.log("book")
    setAppState('book');
    // optimistic open with summary
    setCurrentBook({ ...book });
    // update last used timestamp in list
    setBooks((prev) => prev.map((b) => b.id === book.id ? { ...b } : b));
    try {
      const detail = await DefaultService.getBookById({ uploadId: book.id });
      const data = detail as unknown as Book;
      if (data) {
        setCurrentBook({
          id: data.id || book.id,
          title: data.title || book.title,
          uploadDate: data.uploadDate || book.uploadDate,
          chapters: data.chapters as Chapter[] || [],
        } as Book);
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
          <Flex align="center" gap={16}>
            <Flex vertical className="leading-tight">
              <h1 className="text-base font-medium">PDF Course Generator</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.name}
              </p>
            </Flex>
          </Flex>

          <div className="flex items-center gap-3">
            {appState !== 'upload' && (
            <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (appState === 'toc') {
                      handleBackToUpload();
                  } else if (appState === 'course') {
                    if (lastContentOrigin === 'book') {
                        await refreshCurrentBook();
                        setAppState('book');
                    } else {
                        handleBackToTOC();
                    }
                  } else if (appState === 'library') {
                      setAppState('upload');
                  } else if (appState === 'book') {
                      await handleOpenLibrary();
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
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
            metrics={libraryMetrics || undefined}
          />
        )}

        {appState === 'book' && currentBook && (
          <BookDetail
            book={currentBook}
            onGenerateCourse={handleGenerateCourseForChapter}
            onOpenGeneratedCourse={async (chapterId) => {
              // Open existing or fetch notes-only if needed
              const existing = courses.find(c => c.bookId === currentBook.id && c.chapterId === chapterId);
              if (existing) {
                setCurrentCourse(existing);
                setAppState('course');
                setLastContentOrigin('book');
                return;
              }
              const chapter = currentBook.chapters.find(c => c.chapterId === chapterId);
              if (!chapter) return;
              let mdxText: string = '';
              try {
                mdxText = await DefaultService.getChapterNotes({ uploadId: currentBook.id, chapterId });
              } catch {}
              const openCourse: Course = {
                id: `canonical-${currentBook.id}-${chapter.chapterId}`,
                bookId: currentBook.id,
                bookTitle: currentBook.title,
                chapterId: chapter.chapterId,
                chapterTitle: chapter.title,
                notes: mdxText,
                tasks: [],
                createdDate: new Date().toISOString().split('T')[0],
                completed: false,
                userId: user.id,
              };
              setCurrentCourse(openCourse);
              setAppState('course');
              setLastContentOrigin('book');
            }}
            onDeleteBook={async (bookId: string) => {
              try {
                await DefaultService.deleteBook({ uploadId: bookId });
              } finally {
                await handleOpenLibrary();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function AppProviders() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const algorithm = isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;
  const darkTokens = isDarkMode
    ? {
        colorText: '#e5e7eb',
        colorTextHeading: '#f8fafc',
        colorBgContainer: '#0f172a',
        colorBgElevated: '#1f2937',
        colorLink: '#60a5fa',
      }
    : undefined;

  return (
    <ConfigProvider
      theme={{
        algorithm,
        token: darkTokens,
      }}
    >
      <SettingsProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SettingsProvider>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProviders />
    </ThemeProvider>
  );
}