import { theme as antdTheme, type ThemeConfig } from 'antd';

export const createAppTheme = (isDarkMode: boolean): ThemeConfig => {
    const algorithm = isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

    const darkTokens = {
        colorText: '#e5e7eb',
        colorTextHeading: '#f8fafc',
        colorBgLayout: '#0f172a', // Slate 900
        colorBgContainer: '#1e293b', // Slate 800
        colorBgElevated: '#334155', // Slate 700
        colorLink: '#60a5fa',
        colorBorder: '#334155', // Slate 700
        colorBorderSecondary: '#1e293b',
    };

    const lightTokens = {
        colorBgLayout: '#f8fafc', // Slate 50
        colorBgContainer: '#ffffff',
        colorText: '#0f172a', // Slate 900
        colorTextSecondary: '#64748b', // Slate 500
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
