import type { GlobalToken } from 'antd';
import type { CSSProperties } from 'react';

export const getCourseStyles = (token: GlobalToken) => ({
    container: {
        maxWidth: '72rem',
        margin: '0 auto'
    } as CSSProperties,
    headerMeta: {
        fontSize: '0.875rem',
        color: token.colorTextSecondary
    } as CSSProperties,
    headerTitle: {
        margin: 0
    } as CSSProperties,
    successText: {
        fontSize: '0.875rem',
        color: token.colorSuccess
    } as CSSProperties,
    progressText: {
        fontSize: '0.875rem',
        color: token.colorTextSecondary
    } as CSSProperties,
    taskIndexCircle: {
        width: 32,
        height: 32,
        borderRadius: 9999,
        fontSize: '0.875rem',
        fontWeight: 500,
        backgroundColor: token.colorFillSecondary,
        color: token.colorText,
    } as CSSProperties,
    taskQuestion: {
        fontSize: '1rem'
    } as CSSProperties,
    feedbackBox: {
        padding: 12,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8
    } as CSSProperties,
    infoTone: {
        padding: 12,
        borderRadius: 8,
        border: `1px solid ${token.colorBorder}`,
        backgroundColor: token.colorFillAlter,
        color: token.colorText,
    } as CSSProperties,
    mutedIcon: {
        color: token.colorTextQuaternary
    } as CSSProperties
});
