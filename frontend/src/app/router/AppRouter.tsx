import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from 'antd';
import { AuthForm } from '@/pages/auth';
import { UploadBook } from '@/pages/book-upload';
import { BooksLibrary } from '@/pages/books-library';
import { BookDetail } from '@/pages/book-detail';
import { CoursePage } from '@/pages/course-content';
import { NavBar } from "@/widgets/navbar";
import { UserMenu } from "@/widgets/settings";
import { configureApi } from "@/shared/config";
import { LoadingPage } from "@/shared/ui";
import { useAuth } from '@/shared/lib';

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

export function AppRouter() {
    React.useMemo(() => {
        configureApi();
    }, []);

    return (
        <BrowserRouter>
            <RequireAuth>
                <MainLayout />
            </RequireAuth>
        </BrowserRouter>
    );
}
