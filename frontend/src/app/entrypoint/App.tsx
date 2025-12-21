import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/shared/lib';
import { ThemeProvider, useTheme, SettingsProvider } from '@/features/user-settings';
import { AuthForm } from '@/pages/auth';
import { UploadBook } from '@/pages/book-upload';
import { BooksLibrary } from '@/pages/books-library';
import { BookDetail } from '@/pages/book-detail';
import { CoursePage } from '@/pages/course-content';
import { ConfigProvider, Layout } from 'antd';
import { createAppTheme } from '../styles/appTheme.ts';
import { NavBar } from "@/widgets/navbar";
import { UserMenu } from "@/widgets/settings";
import { configureApi } from "@/shared/config";
import { LoadingPage } from "@/shared/ui";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { Content } = Layout;

function MainLayout() {
  const [showSettings, setShowSettings] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  let appState: 'upload' | 'course' | 'library' | 'book' = 'upload';
  if (location.pathname.startsWith('/library')) {
    appState = 'library';
  }
  if (location.pathname.startsWith('/book')) {
    appState = 'book';
  }
  if (location.pathname.startsWith('/course')) {
    appState = 'course';
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <NavBar
        myBooksOnClick={() => navigate('/library')}
        backOnClick={() => navigate(-1)}
        appState={appState}
        settingsOnClick={() => setShowSettings(true)}
      />
      <UserMenu
        onClose={() => setShowSettings(false)}
        isOpen={showSettings}
      />
      <Content style={{ marginTop: 64, padding: '24px' }}>
        <Routes>
          <Route path="/" element={<UploadBook />} />
          <Route path="/library" element={<BooksLibrary />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/course/:bookId/:chapterId" element={<CoursePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Content>
    </Layout>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <LoadingPage />;
  }
  if (!user) {
    return <AuthForm />;
  }
  return <>{children}</>;
}

function AppContent() {
  configureApi();

  return (
    <BrowserRouter>
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    </BrowserRouter>
  );
}

function AppProviders() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const FIVE_MINUTES = 1000 * 60 * 5;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES,
        refetchOnWindowFocus: false,
      },
    },
  });
  const brandTheme = createAppTheme(isDarkMode);

  return (
    <ConfigProvider theme={brandTheme}>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </SettingsProvider>
      </QueryClientProvider>
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