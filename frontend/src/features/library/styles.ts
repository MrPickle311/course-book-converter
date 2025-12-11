import type { GlobalToken } from 'antd';
import type { CSSProperties } from 'react';

export const getLibraryStyles = (token: GlobalToken) => ({
    container: {
        maxWidth: '72rem',
        margin: '0 auto'
    } as CSSProperties,
    title: {
        margin: 0
    } as CSSProperties,
    card: {
        flex: '1 1 200px'
    } as CSSProperties,
    statValue: {
        fontSize: '1.75rem',
        fontWeight: 600
    } as CSSProperties,
    paginationContainer: {
        marginTop: 16
    } as CSSProperties,
    bookCardIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: token.colorPrimaryBg,
    } as CSSProperties,
    bookCardIcon: {
        fontSize: 20,
        color: token.colorPrimary
    } as CSSProperties,
    bookCardTitle: {
        fontSize: '1.1rem'
    } as CSSProperties,
    bookCardSubtitle: {
        fontSize: '0.875rem'
    } as CSSProperties,
    cardMeta: {
        fontSize: '0.875rem',
        color: token.colorTextSecondary,
        marginBottom: 8
    } as CSSProperties
});
