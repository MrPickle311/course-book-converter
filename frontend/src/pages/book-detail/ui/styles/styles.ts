import type { GlobalToken } from 'antd';
import type { CSSProperties } from 'react';

export const getBookDetailStyles = (token: GlobalToken) => ({
    container: {
        maxWidth: '72rem',
        margin: '0 auto'
    } as CSSProperties,
    headerIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: token.colorPrimaryBg,
    } as CSSProperties,
    headerIcon: {
        fontSize: 24,
        color: token.colorPrimary
    } as CSSProperties,
    headerTitle: {
        margin: 0
    } as CSSProperties,
    headerDate: {
        fontSize: '0.875rem',
        color: token.colorTextSecondary
    } as CSSProperties,
    deleteButtonContainer: {
        marginLeft: 'auto'
    } as CSSProperties,
    statsContainer: {
        marginBottom: 16
    } as CSSProperties,
    statLabel: {
        fontSize: '0.875rem',
        color: token.colorTextSecondary
    } as CSSProperties,
    failedText: {
        color: token.colorError
    } as CSSProperties,
    chapterTitle: {
        margin: 0
    } as CSSProperties,
    chapterPage: {
        fontSize: '0.75rem',
        color: token.colorTextSecondary
    } as CSSProperties,
    chapterMeta: {
        fontSize: '0.875rem',
        color: token.colorTextSecondary
    } as CSSProperties,
});

