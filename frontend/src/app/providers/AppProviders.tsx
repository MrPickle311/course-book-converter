import React from 'react';
import { ConfigProvider, App } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, NotificationProvider } from '@/shared/lib';
import { ThemeProvider, useTheme, SettingsProvider } from '@/features/user-settings';
import { createAppTheme } from '../styles/appTheme';

function InnerAppProviders({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const FIVE_MINUTES = 1000 * 60 * 5;

    const [queryClient] = React.useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: FIVE_MINUTES,
                refetchOnWindowFocus: false,
            },
        },
    }));

    const brandTheme = createAppTheme(isDarkMode);

    return (
        <ConfigProvider theme={brandTheme}>
            <App>
                <QueryClientProvider client={queryClient}>
                    <SettingsProvider>
                        <AuthProvider>
                            <NotificationProvider>
                                {children}
                            </NotificationProvider>
                        </AuthProvider>
                    </SettingsProvider>
                </QueryClientProvider>
            </App>
        </ConfigProvider>
    );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <InnerAppProviders>
                {children}
            </InnerAppProviders>
        </ThemeProvider>
    );
}
