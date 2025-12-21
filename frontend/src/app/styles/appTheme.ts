import { theme as antdTheme, type ThemeConfig } from 'antd';

export const createAppTheme = (isDarkMode: boolean): ThemeConfig => {
    const algorithm = isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

    const darkTokens = {
        colorText: '#e5e7eb',
        colorTextHeading: '#f8fafc',
        colorBgLayout: '#0f172a',
        colorBgContainer: '#1e293b',
        colorBgElevated: '#334155',
        colorLink: '#60a5fa',
        colorBorder: '#334155',
        colorBorderSecondary: '#1e293b',
    };

    const lightTokens = {
        colorBgLayout: '#f8fafc',
        colorBgContainer: '#ffffff',
        colorText: '#0f172a',
        colorTextSecondary: '#64748b',
    };

    return {
        token: {
            colorPrimary: '#4f46e5',
            borderRadius: 8,
            ...(isDarkMode ? darkTokens : lightTokens),
        },
        algorithm,
        cssVar: true,
    };
};
