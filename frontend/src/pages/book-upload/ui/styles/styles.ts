import type {GlobalToken} from "antd";
import type {CSSProperties} from "react";

export const getUploadBookStyles = (token: GlobalToken, isDragOver: boolean) => ({
    container: {
        maxWidth: '60rem',
        margin: '0 auto'
    } as CSSProperties,
    header: {
        textAlign: 'center'
    } as CSSProperties,
    title: {
        marginBottom: 0
    } as CSSProperties,
    mutedText: {
        color: token.colorTextSecondary
    } as CSSProperties,
    dropZone: {
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
        backgroundColor: isDragOver ? token.colorPrimaryBg : token.colorFillAlter, // Using colorFillAlter for 'card' bg approx
    } as CSSProperties,
    iconLarge: {
        fontSize: 48,
        color: token.colorTextTertiary
    } as CSSProperties,
    iconFile: {
        fontSize: 48,
        color: token.colorPrimary
    } as CSSProperties,
    smallMutedText: {
        fontSize: '0.875rem',
        color: token.colorTextSecondary
    } as CSSProperties,
    extraSmallMutedText: {
        fontSize: '0.75rem',
        color: token.colorTextSecondary
    } as CSSProperties,
    processingContainer: {
        width: '100%',
        minWidth: 300
    } as CSSProperties,
    successIcon: {
        fontSize: 16,
        color: token.colorSuccess
    } as CSSProperties
});
