import { useState, useRef, useMemo, useDeferredValue, useEffect, startTransition } from 'react';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface UseMarkdownEditorProps {
    open: boolean;
    initialValue: string;
    onClose: () => void;
    onSave: (value: string) => void;
}

export const useMarkdownEditor = (props: UseMarkdownEditorProps) => {
    const [value, setValue] = useState(props.initialValue);
    const [renderValue, setRenderValue] = useState(props.initialValue);
    const textareaRef = useRef<TextAreaRef | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const lastScrollRatioRef = useRef(0);
    const rafLockRef = useRef<number | null>(null);
    const rafPreviewRef = useRef<number | null>(null);
    const debounceRef = useRef<number | null>(null);
    const typingTimerRef = useRef<number | null>(null);
    const [highlightEnabled, setHighlightEnabled] = useState(true);

    const remarkPlugins = useMemo(() => [remarkGfm], []);
    const rehypePlugins = useMemo(() => (
        highlightEnabled
            ? [[rehypeHighlight, { ignoreMissing: true, subset: ['javascript', 'ts', 'typescript', 'python', 'bash', 'json', 'yaml', 'md', 'markdown'] }]]
            : []
    ), [highlightEnabled]);

    const deferredRenderValue = useDeferredValue(renderValue);

    useEffect(function syncStateWhenOpening() {
        if (props.open) {
            setValue(props.initialValue);
            setRenderValue(props.initialValue);
        }
    }, [props.open, props.initialValue]);

    const schedulePreviewUpdate = (next: string, delay = 120) => {
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }
        debounceRef.current = window.setTimeout(() => {
            if (rafPreviewRef.current) {
                cancelAnimationFrame(rafPreviewRef.current);
            }
            rafPreviewRef.current = requestAnimationFrame(() => {
                const apply = () => startTransition(() => setRenderValue(next));
                if ('requestIdleCallback' in window) {
                    (window as any).requestIdleCallback(apply, { timeout: 300 });
                } else {
                    apply();
                }
            });
        }, delay);
    };

    useEffect(function handleKeyboardShortcuts() {
        if (!open) {
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                props.onClose();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                props.onSave(value);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, props.onClose, props.onSave, value]);

    useEffect(function cleanupPreviewUpdate() {
        if (!open) {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
            }
            if (typingTimerRef.current) {
                window.clearTimeout(typingTimerRef.current);
            }
            if (rafPreviewRef.current) {
                cancelAnimationFrame(rafPreviewRef.current);
            }
        }
        return () => {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
            }
            if (typingTimerRef.current) {
                window.clearTimeout(typingTimerRef.current);
            }
            if (rafPreviewRef.current) {
                cancelAnimationFrame(rafPreviewRef.current);
            }
        }
    }, [open]);

    const getLeftTextareaEl = (): HTMLTextAreaElement | null => {
        const ta = textareaRef.current as TextAreaRef | null;
        const inner = (ta as any)?.resizableTextArea?.textArea as HTMLTextAreaElement | undefined;
        return inner ?? null;
    };

    const handleLeftScroll = () => {
        const left = getLeftTextareaEl();
        const right = previewRef.current;
        if (!left || !right) {
            return;
        }
        if (rafLockRef.current !== null) {
            return;
        }
        rafLockRef.current = window.requestAnimationFrame(() => {
            const leftMax = left.scrollHeight - left.clientHeight;
            const rightMax = right.scrollHeight - right.clientHeight;
            const ratio = leftMax > 0 ? left.scrollTop / leftMax : 0;
            lastScrollRatioRef.current = ratio;
            right.scrollTop = ratio * rightMax;
            if (rafLockRef.current !== null) {
                window.cancelAnimationFrame(rafLockRef.current);
                rafLockRef.current = null;
            }
        });
    };

    useEffect(function syncScrollPreviewToTextarea() {
        const right = previewRef.current;
        const left = getLeftTextareaEl();
        if (!right || !left) {
            return;
        }
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            left.scrollTop += e.deltaY;
            handleLeftScroll();
        };
        right.addEventListener('wheel', onWheel, { passive: false });
        return () => right.removeEventListener('wheel', onWheel as EventListener);
    }, [open]);

    useEffect(function restoreScrollPositionAfterRender() {
        if (!open) {
            return;
        }
        const right = previewRef.current;
        if (!right) {
            return;
        }
        const id = window.requestAnimationFrame(() => {
            const rightMax = right.scrollHeight - right.clientHeight;
            right.scrollTop = lastScrollRatioRef.current * rightMax;
        });
        return () => window.cancelAnimationFrame(id);
    }, [open, deferredRenderValue]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const next = e.target.value;
        setValue(next);
        setHighlightEnabled(false);
        schedulePreviewUpdate(next, 120);
        if (typingTimerRef.current) {
            window.clearTimeout(typingTimerRef.current);
        }
        typingTimerRef.current = window.setTimeout(() => setHighlightEnabled(true), 220);
    };

    return {
        value,
        deferredRenderValue,
        textareaRef,
        previewRef,
        handleTextChange,
        handleLeftScroll,
        remarkPlugins,
        rehypePlugins
    };
};
