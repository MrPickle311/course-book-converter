import { useState, useEffect, useCallback } from 'react';
import { DefaultService, OpenAPI, type ProcessPdfResponse, type GenerateCourseRequest, type GenerateCourseResponse, type BookDetail as ApiBookDetail, type Chapter as ApiChapter } from '@/openapi';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ThemeProvider } from './components/ThemeContext';
import { SettingsProvider } from './components/SettingsContext';
import { AuthForm } from './components/AuthForm';
import { UserMenu } from './components/UserMenu';
import { UploadPDF } from './components/UploadPDF';
import { TableOfContents } from './components/TableOfContents';
import {type Course, CourseContent} from './components/CourseContent';
import { BooksLibrary } from './components/BooksLibrary';
import { BookDetail } from './components/BookDetail.tsx';
import { Button } from './components/ui/button';
import { ArrowLeft, Library, LogOut } from 'lucide-react';

type AppState = 'upload' | 'toc' | 'course' | 'library' | 'book';

type Book = ApiBookDetail;
type Chapter = ApiChapter;

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
          chapters: [],
        } as Book));
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
    const newBook: Book = {
      id: uploadId,
      title: file.name.replace('.pdf', ''),
      uploadDate: new Date().toISOString().split('T')[0],
      chapters: (chapters as any) || [],
    } as Book;
    setBooks(prev => [newBook, ...prev]);
    setCurrentBook(newBook);
    console.log("library")
    setAppState('library');
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
    const gen: GenerateCourseResponse = await DefaultService.generateCourse({ requestBody: req });
    const tasks: Task[] = (gen?.tasks || []).map((t, idx) => ({
      id: `task-${currentBook.id}-${chapter.chapterId}-gen-${idx + 1}`,
      question: t.title || `Task ${idx + 1}`,
      type: 'short-answer',
      expectedKeywords: t.successCriteria,
      completed: false,
    }));
    // Fetch generated MDX notes bundle for this chapter
    let notes: any = [];
    try {
      const mdxText = await DefaultService.getChapterNotes({ uploadId: currentBook.id, chapterId: chapter.chapterId });
      if (typeof mdxText === 'string' && mdxText.trim().length > 0) {
        notes = [{ type: 'richText', title: gen?.title || chapter.title, markdown: mdxText } as any];
      }
    } catch {
    }
    const newCourse: Course = {
      id: `canonical-${currentBook.id}-${chapter.chapterId}`,
      bookId: currentBook.id,
      bookTitle: currentBook.title,
      chapterId: chapter.chapterId,
      chapterTitle: gen?.title || chapter.title,
      notes,
      tasks,
      createdDate: new Date().toISOString().split('T')[0],
      completed: false,
      userId: user.id
    };
    setCourses(prev => [...prev, newCourse]);
    setBooks(prev => prev.map(b => b.id === currentBook.id ? { ...b } : b));
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

  const handleOpenLibrary = () => {
    setAppState('library');
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
      const data = detail?.data;
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
          <div className="flex items-center gap-4">
            {appState !== 'upload' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (appState === 'toc') {
                      handleBackToUpload();
                  }
                  else if (appState === 'course') {
                    if (lastContentOrigin === 'book') {
                        console.log("book")
                        setAppState('book');
                    }
                    else {
                        handleBackToTOC();
                    }
                  }
                  else if (appState === 'library') {
                      console.log("upload")
                      setAppState('upload');
                  }
                  else if (appState === 'book') {
                      console.log("library")
                      setAppState('library');
                  }
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
            // TableOfContents expects legacy shape; adapt minimally
            book={{
              id: currentBook.id,
              title: currentBook.title,
              uploadDate: currentBook.uploadDate,
              tableOfContents: currentBook.chapters.map((c, idx) => ({
                id: c.chapterId,
                title: c.title,
                page: c.startPage ?? (idx + 1),
              })),
            } as any}
            onChapterSelect={(legacy) => handleChapterSelect({
              chapterId: legacy.id,
              title: legacy.title,
              startPage: legacy.page,
              endPage: legacy.page,
              isGenerated: false,
            } as Chapter)}
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
              let notes: any = [];
              try {
                const mdxText = await DefaultService.getChapterNotes({ uploadId: currentBook.id, chapterId });
                if (typeof mdxText === 'string' && mdxText.trim().length > 0) {
                  notes = [{ type: 'richText', title: chapter.title, markdown: mdxText } as any];
                }
              } catch {}
              const openCourse: Course = {
                id: `canonical-${currentBook.id}-${chapter.chapterId}`,
                bookId: currentBook.id,
                bookTitle: currentBook.title,
                chapterId: chapter.chapterId,
                chapterTitle: chapter.title,
                notes,
                tasks: [],
                createdDate: new Date().toISOString().split('T')[0],
                completed: false,
                userId: user.id,
              };
              setCurrentCourse(openCourse);
              setAppState('course');
              setLastContentOrigin('book');
            }}
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