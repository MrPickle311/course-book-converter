import type { GlobalToken } from 'antd';
import type { CSSProperties } from 'react';

export const getAuthStyles = (token: GlobalToken) => ({
    container: {
        minHeight: '100vh',
        backgroundColor: token.colorBgLayout,
        padding: '0 1rem'
    } as CSSProperties,
    wrapper: {
        width: '100%',
        maxWidth: 420
    } as CSSProperties,
    logoContainer: {
        textAlign: 'center' as const
    } as CSSProperties,
    logoIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 24,
        backgroundColor: token.colorPrimaryBg,
        margin: '0 auto',
    } as CSSProperties,
    logoIcon: {
        fontSize: 32,
        color: token.colorPrimary
    } as CSSProperties,
    title: {
        margin: 0
    } as CSSProperties,
    cardTitle: {
        textAlign: 'center' as const
    } as CSSProperties,
    formContainer: {
        marginTop: 24
    } as CSSProperties,
    divider: {
        fontSize: '0.75rem',
        color: token.colorTextSecondary,
        margin: 0
    } as CSSProperties,
    inputPrefix: {
        color: token.colorTextQuaternary
    } as CSSProperties,
    errorText: {
        fontSize: '0.875rem'
    } as CSSProperties,
});
