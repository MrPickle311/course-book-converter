import {useCallback, useEffect, useState} from 'react';
import {AuthProvider, useAuth} from '../../shared/lib/context/AuthContext.tsx';
import {ThemeProvider, useTheme} from '@/features/user-settings/config/ThemeContext.tsx';
import {SettingsProvider} from '@/features/user-settings/config/SettingsContext.tsx';
import AuthForm from '@/pages/auth/ui/components/AuthForm.tsx';
import {UploadBook} from '@/pages/book-upload/ui/components/UploadBook.tsx';
import {type Course} from '@/entities/course/model/types.ts';
import {CourseContent} from '@/pages/course-content/ui/components/CourseContent.tsx';
import {BooksLibrary} from '@/pages/books-library/ui/components/BooksLibrary.tsx';
import {BookDetail} from '@/pages/book-detail/ui/components/BookDetail.tsx';
import {ConfigProvider, Layout} from 'antd';
import {createAppTheme} from '../styles/appTheme.ts';
import {NavBar} from "@/widgets/navbar/ui/components/NavBar.tsx";
import {UserMenu} from "@/widgets/settings/ui/components/UserMenu.tsx";
import {booksApi} from "@/pages/book-detail/api/bookApi.ts";
import {coursesApi} from "@/pages/course-content/api/coursesApi.ts";
import type {Metrics} from "@/entities/metrics/model/types.tsx";
import {uploadApi} from "@/pages/book-upload/api/uploadApi.ts";
import type {Book} from "@/entities/book/model/types.ts";
import {configureApi} from "@/shared/config/api/apiConfig.ts";
import {LoadingPage} from "@/shared/ui/components/LoadingPage.tsx";
import {QueryClient, QueryClientProvider, useQuery, type UseQueryResult} from '@tanstack/react-query';

const { Content } = Layout;

type AppState = 'upload' | 'course' | 'library' | 'book';

function AppContent() {
 configureApi()
  const { user, isLoading } = useAuth();
  const [appState, setAppState] = useState<AppState>('upload');
  const [books, setBooks] = useState<Book[]>([]);
  const [libraryMetrics, setLibraryMetrics] = useState<Metrics | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [lastContentOrigin, setLastContentOrigin] = useState<'toc' | 'book' | null>(null);
  const [showSettings, setShowSettings] = useState(false);


  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const refreshBooks = useCallback(async () => {
    try {
      const res = await booksApi.getBooksList(1,20)
      setBooks(res.books);
      setLibraryMetrics(res.metrics)
    } catch (e) {
      console.error('Failed to load books', e);
    }
  }, []);

  useEffect(function loadBooksOnFirstLogin() {
    if (!user) {
      return;
    }
    (async () => {
      await refreshBooks();
    })();
  }, [user?.id]);

  const refreshCurrentBook = useCallback(async () => {
    try {
      if (!currentBook) {
        return;
      }
      const detail = await booksApi.getBookDetails(currentBook.id)
      setCurrentBook(detail)
    } catch (e) {
      console.error('Failed to refresh book details', e);
    }
  }, [currentBook]);

  const handleFileUpload = async (file: File) => {
    const form = { file } as any;
    const resp = await uploadApi.processPdf(form)
    if (!resp?.isSuccess || !resp.chapters) {
      return;
    }

    const newBook = await booksApi.getBookDetails(resp.bookId)

    setBooks(prev => [newBook, ...prev]);
    setCurrentBook(newBook);
    await handleOpenLibrary();
  };

  const handleGenerateCourseForChapter = async (chapterId: string) => {
    if (!currentBook || !user) {
      return;
    }
    const chapter = currentBook.chapters.find(c => c.chapterId === chapterId);
    if (!chapter) {
      return;
    }
    await coursesApi.generateCourse(currentCourse?.chapterId, currentBook.id)
    try {
      const freshBook = await booksApi.getBookDetails(currentBook.id);
      if (freshBook) {
        setCurrentBook(freshBook);
        setBooks(prev => prev.map(b => b.id === currentBook.id ? {
          ...b,
          title: freshBook.title || b.title,
          uploadDate: freshBook.uploadDate || b.uploadDate,
        } : b));
      }
    } catch {
    }
  };

  const handleOpenLibrary = async () => {
    setAppState('library');
    await refreshBooks();
  };

  const handleOpenBook = async (book: Book) => {
      setAppState('book');
    setCurrentBook({ ...book });
    const moveLastUsedBookToTop = () => {
      setBooks((prev) => prev.map((b) => b.id === book.id ? {...b} : b));
    }
    moveLastUsedBookToTop();
    try {
      const data = await booksApi.getBookDetails(book.id);
      setCurrentBook(data);
    } catch (e) {
      console.error('Failed to fetch book details', e);
    }
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    setCurrentCourse(updatedCourse);
  };

  const backOnClick = async () => {
    if (appState === 'course') {
      if (lastContentOrigin === 'book') {
        await refreshCurrentBook();
        setAppState('book');
      }
      return;
    }
    if (appState === 'library') {
      setAppState('upload');
      return;
    }
    if (appState === 'book') {
      await handleOpenLibrary();
    }
  };

  if (isLoading) {
    return <LoadingPage/>;
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Layout style={{minHeight: '100vh'}}>
      <NavBar
        myBooksOnClick={handleOpenLibrary}
        backOnClick={backOnClick}
        appState={appState}
        settingsOnClick={handleOpenSettings}
      />
      <UserMenu
          onClose={handleCloseSettings}
          isOpen={showSettings}
      />
      <Content
          style={{
            marginTop: 64,
            padding: '24px'
          }}
      >
          {appState === 'upload' && (
              <UploadBook
                  onFileUpload={handleFileUpload}
                  userCourses={courses.filter(course => course.userId === user.id)}
              />
          )}

          {appState === 'course' && (
               currentCourse ? <CourseContent
                  course={currentCourse}
                  onUpdateCourse={handleUpdateCourse}
              /> : <LoadingPage/>
          )}

          {appState === 'library' && libraryMetrics && (
              <BooksLibrary
                  books={books}
                  courses={courses.filter(course => course.userId === user.id)}
                  onOpenBook={handleOpenBook}
                  metrics={libraryMetrics}
              />
          )}

          {appState === 'book' && currentBook && (
              <BookDetail
                  book={currentBook}
                  onGenerateCourse={handleGenerateCourseForChapter}
                  onOpenGeneratedCourse={async (chapterId) => {
                      setAppState('course');
                      setCurrentCourse(null);
                    const chapter = currentBook.chapters.find(c => c.chapterId === chapterId);
                    if (!chapter) {
                      return;
                    }
                    // let mdxText: UseQueryResult<string, Error> | null = null;
                      let mdxText: string = '';
                    try {
                        mdxText = await coursesApi.getCourseNotes(currentBook.id, chapterId);
                      // mdxText = useQuery(
                      //     {
                      //         queryKey: ["notes-" + chapterId],
                      //         queryFn: async () => await coursesApi.getCourseNotes(currentBook.id, chapterId),
                      //         staleTime: 60000
                      //     }
                      // );
                    } catch (e) {
                        console.error("Error during fetching notes" + e.toString())
                    }
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
                    setLastContentOrigin('book');
                  }}
                  onDeleteBook={async (bookId: string) => {
                    try {
                      await booksApi.deleteBook({id: bookId} as Book);
                    } finally {
                      await handleOpenLibrary();
                    }
                  }}
              />
          )}
      </Content>
    </Layout>
  );
}

function AppProviders() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
    const queryClient = new QueryClient();

  const brandTheme = createAppTheme(isDarkMode);

  return (
    <ConfigProvider theme={brandTheme}>
        <QueryClientProvider client={queryClient}>
      <AppContentWrapper />
        </QueryClientProvider>
    </ConfigProvider>
  );
}

function AppContentWrapper() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SettingsProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProviders />
    </ThemeProvider>
  );
}