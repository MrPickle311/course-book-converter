import { type GlobalToken } from 'antd';
import type { CSSProperties } from 'react';

export const useAppStyles = (token: GlobalToken) => {
    return {
        pageContainer: {
            maxWidth: '72rem',
            margin: '0 auto',
            padding: '24px',
            width: '100%'
        } as CSSProperties,

        narrowContainer: {
            maxWidth: '60rem',
            margin: '0 auto',
            width: '100%'
        } as CSSProperties,

        authContainer: {
            minHeight: '100vh',
            backgroundColor: token.colorBgLayout,
            padding: '0 1rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        } as CSSProperties,

        authWrapper: {
            width: '100%',
            maxWidth: 420
        } as CSSProperties,

        headerTitle: {
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: 600
        } as CSSProperties,

        sectionTitle: {
            fontSize: '1.25rem',
            fontWeight: 600,
            margin: 0
        } as CSSProperties,

        textSecondary: {
            color: token.colorTextSecondary,
            fontSize: '0.875rem'
        } as CSSProperties,

        textMuted: {
            color: token.colorTextSecondary
        } as CSSProperties,

        card: {
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorder}`,
            backgroundColor: token.colorBgContainer,
            overflow: 'hidden'
        } as CSSProperties,

        iconWrapper: {
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: token.colorPrimaryBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: token.colorPrimary
        } as CSSProperties,

        iconWrapperSmall: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: token.colorPrimaryBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: token.colorPrimary
        } as CSSProperties,

        dropZone: (isDragOver: boolean) => ({
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: isDragOver ? token.colorPrimaryBorder : token.colorBorder,
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            maxWidth: 520,
            margin: '0 auto',
            backgroundColor: isDragOver ? token.colorPrimaryBg : token.colorFillAlter,
        } as CSSProperties),

        taskFeedbackBox: {
            padding: 12,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 8,
            backgroundColor: token.colorBgContainer
        } as CSSProperties,

        infoBox: {
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${token.colorBorder}`,
            backgroundColor: token.colorFillAlter,
            color: token.colorText,
        } as CSSProperties,

        fullScreenModal: {
            height: '86vh',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
        } as CSSProperties
    };
};
