import type { GlobalToken } from 'antd';
import type { CSSProperties } from 'react';

export const getEditorStyles = (token: GlobalToken) => ({
    modalBody: {
        height: '86vh',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
    } as CSSProperties,
    columnLeft: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        minHeight: 0,
    } as CSSProperties,
    columnRight: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
    } as CSSProperties,
    header: {
        padding: '8px 12px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
    } as CSSProperties,
    textArea: {
        height: '100%',
        width: '100%',
        border: 'none',
        borderRadius: 0,
        background: token.colorBgContainer,
        color: token.colorText,
        padding: 12,
        fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '0.95rem',
        lineHeight: 1.5,
        tabSize: 2,
        overflow: 'auto',
        resize: 'none',
    } as CSSProperties,
    previewContainer: {
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        padding: 12,
        scrollbarWidth: 'none', // FireFox
    } as CSSProperties,
});
