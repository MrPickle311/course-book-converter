import { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
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
  notes: string;
  tasks: Task[];
  createdDate: string;
  completed: boolean;
  userId: string;
}

interface Task {
  id: string;
  question: string;
  type: 'multiple-choice' | 'short-answer' | 'code';
  options?: string[];
  correctAnswer?: string;
  userAnswer?: string;
  completed: boolean;
}

const mockBooks: Book[] = [
  {
    id: '1',
    title: 'Advanced React Patterns',
    uploadDate: '2024-01-15',
    tableOfContents: [
      { id: '1-1', title: 'Introduction to Advanced Patterns', page: 1 },
      { id: '1-2', title: 'Higher-Order Components', page: 15 },
      { id: '1-3', title: 'Render Props Pattern', page: 32 },
      { id: '1-4', title: 'Custom Hooks', page: 48 },
      { id: '1-5', title: 'Context API Deep Dive', page: 65 },
    ]
  },
  {
    id: '2',
    title: 'Machine Learning Fundamentals',
    uploadDate: '2024-02-20',
    tableOfContents: [
      { id: '2-1', title: 'Introduction to ML', page: 1 },
      { id: '2-2', title: 'Supervised Learning', page: 25 },
      { id: '2-3', title: 'Unsupervised Learning', page: 55 },
      { id: '2-4', title: 'Neural Networks', page: 85 },
    ]
  }
];

const mockCourses: Course[] = [
  {
    id: 'c1',
    bookId: '1',
    bookTitle: 'Advanced React Patterns',
    chapterId: '1-2',
    chapterTitle: 'Higher-Order Components',
    notes: `# Higher-Order Components (HOCs)

## What are Higher-Order Components?

A Higher-Order Component is a function that takes a component and returns a new component. HOCs are a pattern that emerges from React's compositional nature.

## Key Concepts:

1. **Function Composition**: HOCs use function composition to enhance components
2. **Cross-cutting Concerns**: Perfect for sharing logic between components
3. **Props Proxy**: HOCs can manipulate props before passing them down

## Common Use Cases:

- Authentication checks
- Loading states
- Data fetching
- Conditional rendering

## Example Implementation:

\`\`\`jsx
const withAuth = (WrappedComponent) => {
  return (props) => {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
      return <LoginForm />;
    }
    
    return <WrappedComponent {...props} />;
  };
};
\`\`\`

## Best Practices:

1. Don't mutate the original component
2. Pass through unrelated props
3. Maximize composability
4. Use displayName for debugging`,
    tasks: [
      {
        id: 't1',
        question: 'What does HOC stand for?',
        type: 'multiple-choice',
        options: ['High Order Component', 'Higher-Order Component', 'Heavy Object Class', 'Hybrid Object Container'],
        correctAnswer: 'Higher-Order Component',
        completed: false
      },
      {
        id: 't2',
        question: 'Write a simple HOC that adds a loading state to any component.',
        type: 'code',
        completed: false
      },
      {
        id: 't3',
        question: 'Name three common use cases for HOCs.',
        type: 'short-answer',
        completed: false
      }
    ],
    createdDate: '2024-01-20',
    completed: false,
    userId: '1'
  }
];

function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const [appState, setAppState] = useState<AppState>('upload');
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);

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
      notes: `# ${chapter.title}

## Overview
This chapter covers important concepts related to ${chapter.title.toLowerCase()}.

## Key Points:
1. Fundamental concepts and definitions
2. Practical applications and examples
3. Common patterns and best practices
4. Troubleshooting and debugging techniques

## Learning Objectives:
By the end of this chapter, you will be able to:
- Understand the core concepts
- Apply the knowledge in practical scenarios
- Identify common pitfalls and how to avoid them

## Detailed Content:
[Course content would be generated here based on the PDF chapter content]`,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          question: `What are the main concepts covered in ${chapter.title}?`,
          type: 'short-answer',
          completed: false
        },
        {
          id: `task-${Date.now()}-2`,
          question: `Which statement best describes ${chapter.title}?`,
          type: 'multiple-choice',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
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
            <UserMenu onOpenLibrary={handleOpenLibrary} />
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}