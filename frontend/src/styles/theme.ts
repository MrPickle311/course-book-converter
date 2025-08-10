export const theme = {
  colors: {
    primary: '#1890ff',
    secondary: '#52c41a',
    danger: '#ff4d4f',
    warning: '#faad14',
    info: '#1890ff',

    // Grayscale
    gray100: '#f5f5f5',
    gray200: '#e8e8e8',
    gray300: '#d9d9d9',
    gray400: '#bfbfbf',
    gray500: '#8c8c8c',
    gray600: '#595959',
    gray700: '#434343',
    gray800: '#262626',
    gray900: '#141414',

    // Background
    background: '#ffffff',
    backgroundSecondary: '#fafafa',

    // Text
    textPrimary: '#262626',
    textSecondary: '#595959',
    textTertiary: '#8c8c8c',

    // Border
    border: '#d9d9d9',
    borderSecondary: '#f0f0f0',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  breakpoints: {
    xs: '480px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1600px',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

export type Theme = typeof theme;
