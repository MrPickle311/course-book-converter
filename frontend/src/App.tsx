import { useState, useEffect } from 'react';
import { getMockNotesByChapter, defaultDemoBlocks } from './mocks/Mock';
import type { NoteBlock } from './mocks/Mock';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ThemeProvider } from './components/ThemeContext';
import { SettingsProvider } from './components/SettingsContext';
import { AuthForm } from './components/AuthForm';
import { UserMenu } from './components/UserMenu';
import { UploadPDF } from './components/UploadPDF';
import { TableOfContents } from './components/TableOfContents';
import { CourseContent } from './components/CourseContent';
import { CourseLibrary } from './components/CourseLibrary';
import { Button } from './components/ui/button';
import { ArrowLeft, Library, LogOut } from 'lucide-react';

type AppState = 'upload' | 'toc' | 'course' | 'library';

interface Book {
  id: string;
  title: string;
  uploadDate: string;
  tableOfContents: Chapter[];
}

interface Chapter {
  id: string;
  title: string;
  page: number;
  hasSubchapters?: boolean;
  subchapters?: Chapter[];
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

const generateMockBooks = (count: number): Book[] => {
  const sampleTitles = [
    'Architecture: The Hard Parts',
    'Optimizing Java',
    'Clean Code',
    'Refactoring',
    'Designing Data-Intensive Applications',
    "You Don't Know JS",
    'Effective TypeScript',
    'Domain-Driven Design',
    'The Pragmatic Programmer',
    'Patterns of Enterprise Application Architecture',
    'Introduction to Algorithms',
    'Operating Systems: Three Easy Pieces',
    'Site Reliability Engineering',
    'Microservices Patterns',
    'Kubernetes Up & Running',
    'The Art of Computer Programming',
    'The Mythical Man-Month',
    'The Design of Everyday Things',
    'The Little Schemer',
    'The Pragmatic Developer',
    'The Clean Coder',
    'The Clean Architecture',
    'The Software Craftsman',
    'The Mythical Man-Month',
    'The Design of Everyday Things',
    'The Little Schemer',
    'The Pragmatic Developer',
    'The Clean Coder',
    'The Clean Architecture',
    'The Software Craftsman',
    'The Pragmatic Programmer',

  ];

  const books: Book[] = [];
  for (let i = 0; i < count; i++) {
    const id = (i + 1).toString();
    const title = sampleTitles[i % sampleTitles.length] + (i >= sampleTitles.length ? ` (Vol. ${Math.floor(i / sampleTitles.length) + 1})` : '');
    const uploadDate = `2024-${String(((i % 12) + 1)).padStart(2, '0')}-${String(((i % 27) + 1)).padStart(2, '0')}`;
    const chapters = Array.from({ length: 6 }, (_, c) => ({
      id: `${id}-${c + 1}`,
      title: c === 0 ? 'Introduction' : c === 1 ? 'Core Concepts' : c === 2 ? 'Advanced Topics' : c === 3 ? 'Best Practices' : c === 4 ? 'Case Studies' : 'Appendix',
      page: c === 0 ? 1 : c * 20 + 1,
    }));

    books.push({ id, title, uploadDate, tableOfContents: chapters });
  }
  return books;
};

const mockBooks: Book[] = generateMockBooks(31);

// Generate many mock courses for pagination/performance testing
const generateMockCourses = (books: Book[], userId: string, replicationsPerChapter = 100): Course[] => {
  const courses: Course[] = [];
  const adjectives = ['Foundations of', 'Deep Dive into', 'Practical', 'Modern', 'Advanced', 'Hands-on', 'Applied', 'Strategic', 'Tactical', 'Essential'];
  const topics = ['Patterns', 'Workflows', 'Techniques', 'Guides', 'Blueprints', 'Playbook', 'Concepts', 'Principles', 'Scenarios', 'Case Studies'];
  const variants = ['Overview', 'Checklist', 'Anti-Patterns', 'Pitfalls', 'Heuristics', 'Recipes', 'Field Notes', 'Insights', 'Best Practices', 'FAQ'];

  const buildVariedTitle = (base: string, index: number): string => {
    const a = adjectives[index % adjectives.length];
    const t = topics[Math.floor(index / adjectives.length) % topics.length];
    const v = variants[Math.floor(index ) % variants.length];
    return `${base}: ${a} ${t} — ${v}`;
  };
  books.forEach((book) => {
    book.tableOfContents.forEach((chapter) => {
      for (let i = 1; i <= replicationsPerChapter; i++) {
        const titleWithPart = buildVariedTitle(chapter.title, i - 1);
        const chapterForNotes = `Chapter ${((i - 1) % 6) + 1}`; // cycle through chapter 1..6 from mocks
        courses.push({
          id: `seed-${book.id}-${chapter.id}-${i}`,
          bookId: book.id,
          bookTitle: book.title,
          chapterId: `${chapter.id}-p${i}`,
          chapterTitle: titleWithPart,
          notes: (getMockNotesByChapter(chapterForNotes) as NoteBlock[]) || defaultDemoBlocks,
          tasks: [
            {
              id: `task-${book.id}-${chapter.id}-${i}-1`,
              question: `What are the main concepts covered in ${titleWithPart}?`,
              type: 'short-answer',
              expectedKeywords: ['trade-offs', 'fitness functions', 'adr'],
              completed: false
            },
            {
              id: `task-${book.id}-${chapter.id}-${i}-2`,
              question: `Which statement best describes ${titleWithPart}?`,
              type: 'multiple-choice',
              options: [
                'This quite longer response A. Blah blah blah with extra words and even more words to test the length of the answer. Also another sentence.', 
                'This is a much longer option B with even more words to test the length of the answer. Also another sentence.', 
                'This is a shorter option C with even more words to test the length of the answer. Also another sentence.', 
                'This is a shorter option D with even more words to test the length of the answer. Also another sentence.'
              ],
              correctAnswer: 'This quite longer response A. Blah blah blah with extra words and even more words to test the length of the answer. Also another sentence.',
              completed: false
            },
            {
              id: `task-${book.id}-${chapter.id}-${i}-3`,
              question: `Select all that apply to ${titleWithPart}`,
              type: 'multiple-select',
              options: [
                'This quite longer response A. Blah blah blah with extra words and even more words to test the length of the answer. Also another sentence.', 
                'This is a much shorter option B with even more words to test the length of the answer. Also another sentence.', 
                'This is a much shorter option C with even more words to test the length of the answer. Also another sentence.', 
                'This is a shorter option D with even more words to test the length of the answer. Also another sentence.'],
              correctAnswers: ['This quite longer response A. Blah blah blah with extra words and even more words to test the length of the answer. Also another sentence.', 
                'This is a much shorter option B with even more words to test the length of the answer. Also another sentence.'],
              completed: false
            },
            {
              id: `task-${book.id}-${chapter.id}-${i}-4`,
              question: `Upload a supporting PDF related to ${titleWithPart}`,
              type: 'upload-pdf',
              completed: false
            }
          ],
          createdDate: '2024-01-20',
          completed: false,
          userId
        });
      }
    });
  });
  return courses;
};

// Seed per logged-in user in component once user is available
const mockCourses: Course[] = [];

function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const [appState, setAppState] = useState<AppState>('upload');
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);

  // Seed courses for logged-in user exactly once
  useEffect(() => {
    if (!user) return;
    if (courses.length > 0) return;
    const seeded = generateMockCourses(books, user.id, 5);
    setCourses(seeded);
  }, [user?.id, courses.length, books]);

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

  const handleFileUpload = (file: File) => {
    // Simulate processing and TOC extraction
    setTimeout(() => {
      const newBook: Book = {
        id: Date.now().toString(),
        title: file.name.replace('.pdf', ''),
        uploadDate: new Date().toISOString().split('T')[0],
        tableOfContents: [
          { id: `${Date.now()}-1`, title: 'Introduction', page: 1 },
          { id: `${Date.now()}-2`, title: 'Getting Started', page: 15 },
          { id: `${Date.now()}-3`, title: 'Advanced Topics', page: 45 },
          { id: `${Date.now()}-4`, title: 'Best Practices', page: 78 },
          { id: `${Date.now()}-5`, title: 'Conclusion', page: 95 },
        ]
      };
      setBooks(prev => [...prev, newBook]);
      setCurrentBook(newBook);
      setAppState('toc');
    }, 2000);
  };

  const handleChapterSelect = (chapter: Chapter) => {
    // Generate course for selected chapter
    const newCourse: Course = {
      id: Date.now().toString(),
      bookId: currentBook!.id,
      bookTitle: currentBook!.title,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      notes: (getMockNotesByChapter(chapter.title) as NoteBlock[]) || defaultDemoBlocks,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          question: `What are the main concepts covered in ${chapter.title}?`,
          type: 'short-answer',
          expectedKeywords: ['trade-offs', 'fitness functions', 'adr'],
          completed: false
        },
        {
          id: `task-${Date.now()}-2`,
          question: `Which statement best describes ${chapter.title}?`,
          type: 'multiple-choice',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          completed: false
        },
        {
          id: `task-${Date.now()}-3`,
          question: `Select all that apply to ${chapter.title}`,
          type: 'multiple-select',
          options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
          correctAnswers: ['Concept B', 'Concept D'],
          completed: false
        },
        {
          id: `task-${Date.now()}-4`,
          question: `Upload a supporting PDF related to ${chapter.title}`,
          type: 'upload-pdf',
          completed: false
        }
      ],
      createdDate: new Date().toISOString().split('T')[0],
      completed: false,
      userId: user.id
    };
    
    setCourses(prev => [...prev, newCourse]);
    setCurrentCourse(newCourse);
    setAppState('course');
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
    setCurrentCourse(course);
    setAppState('course');
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    setCurrentCourse(updatedCourse);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {appState !== 'upload' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (appState === 'toc') handleBackToUpload();
                  else if (appState === 'course') handleBackToTOC();
                  else if (appState === 'library') setAppState('upload');
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
              My Courses
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
          <CourseLibrary
            books={books}
            courses={courses.filter(course => course.userId === user.id)}
            onSelectCourse={handleSelectCourse}
          />
        )}
      </main>
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