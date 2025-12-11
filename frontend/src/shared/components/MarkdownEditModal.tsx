import React, { useDeferredValue, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { Modal, Row, Col, Typography, Input, Button, theme } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import '../../styles/mdx.css';
import '../../styles/markdown-editor.css';

interface MarkdownEditModalProps {
  open: boolean;
  title?: string;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

export function MarkdownEditModal({ open, title = 'Edit Markdown', initialValue, onClose, onSave }: MarkdownEditModalProps) {
  const [value, setValue] = useState(initialValue);
  // Separate render value so preview updates are decoupled from typing
  const [renderValue, setRenderValue] = useState(initialValue);
  const textareaRef = useRef<TextAreaRef | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const lastScrollRatioRef = useRef(0);
  const rafLockRef = useRef<number | null>(null);
  // rAF throttle for preview commits
  const rafPreviewRef = useRef<number | null>(null);
  // debounce timer for preview updates
  const debounceRef = useRef<number | null>(null);
  // typing pause timer (for toggling syntax highlighting)
  const typingTimerRef = useRef<number | null>(null);
  const [highlightEnabled, setHighlightEnabled] = useState(true);

  const { token } = theme.useToken();

  // Hoist plugin arrays to avoid re-creating them on every render
  const remarkPlugins = useMemo(() => [remarkGfm], []);
  const rehypePlugins = useMemo(() => (
    highlightEnabled
      ? [[rehypeHighlight, { ignoreMissing: true, subset: ['javascript', 'ts', 'typescript', 'python', 'bash', 'json', 'yaml', 'md', 'markdown'] }]]
      : []
  ), [highlightEnabled]);

  // Defer heavy preview rendering to keep typing snappy
  const deferredRenderValue = useDeferredValue(renderValue);

  // Keep local state in sync when opening with different content
  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setRenderValue(initialValue);
    }
  }, [open, initialValue]);

  // Schedule preview updates with debounce + rAF + (optional) requestIdleCallback
  const schedulePreviewUpdate = (next: string, delay = 120) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      if (rafPreviewRef.current) cancelAnimationFrame(rafPreviewRef.current);
      rafPreviewRef.current = requestAnimationFrame(() => {
        const apply = () => startTransition(() => setRenderValue(next));
        if ('requestIdleCallback' in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).requestIdleCallback(apply, { timeout: 300 });
        } else {
          apply();
        }
      });
    }, delay);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave(value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onSave, value]);

  // Clean up timers on close/unmount
  useEffect(() => {
    if (!open) {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (rafPreviewRef.current) cancelAnimationFrame(rafPreviewRef.current);
    }
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (rafPreviewRef.current) cancelAnimationFrame(rafPreviewRef.current);
    };
  }, [open]);

  // Helper to access the underlying HTMLTextAreaElement from AntD TextArea
  const getLeftTextareaEl = (): HTMLTextAreaElement | null => {
    const ta = textareaRef.current as TextAreaRef | null;
    // AntD exposes underlying textarea via resizableTextArea.textArea
    // types are safe-guarded but may be undefined during first render
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inner = (ta as any)?.resizableTextArea?.textArea as HTMLTextAreaElement | undefined;
    return inner ?? null;
  };

  // Sync scroll: left (textarea) is the primary scrollbar; right preview mirrors it
  const handleLeftScroll = () => {
    const left = getLeftTextareaEl();
    const right = previewRef.current;
    if (!left || !right) {
      return;
    }
    // rAF throttle to avoid layout thrash on fast scroll
    if (rafLockRef.current !== null) return;
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

  // When user wheels over the preview, forward scroll to the textarea to keep single-scroll UX
  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // When the (deferred) preview content updates and its height changes, re-apply the last scroll ratio
  useEffect(() => {
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

  if (!open) return null;

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      width="96vw"
      style={{ top: 8 }}
      styles={{ body: { height: '86vh', padding: 0 } }}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={() => onSave(value)}>
          Save
        </Button>,
      ]}
    >
      <Row gutter={0} style={{ height: '100%' }}>
        <Col span={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${token.colorBorderSecondary}`, minHeight: 0 }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}>
            <Typography.Text type="secondary" style={{ fontSize: '0.85rem' }}>Markdown</Typography.Text>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Input.TextArea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                const next = e.target.value;
                setValue(next); // instant typing
                // disable highlighting while actively typing
                setHighlightEnabled(false);
                schedulePreviewUpdate(next, 120);
                if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
                typingTimerRef.current = window.setTimeout(() => setHighlightEnabled(true), 220);
              }}
              onScroll={handleLeftScroll}
              spellCheck={false}
              autoSize={false}
              style={{
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
              }}
            />
          </div>
        </Col>

        <Col span={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer }}>
            <Typography.Text type="secondary" style={{ fontSize: '0.85rem' }}>Preview</Typography.Text>
          </div>
          <div
            ref={previewRef}
            className="bcc-preview-scroll"
            style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: 12 }}
          >
            <div className="mdx-content">
              <MemoPreview value={deferredRenderValue} remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} />
            </div>
          </div>
        </Col>
      </Row>
    </Modal>
  );
}

export default MarkdownEditModal;

// Separate memoized preview to avoid unnecessary re-renders while typing
const Preview = ({
  value,
  remarkPlugins,
  rehypePlugins,
}: {
  value: string;
  remarkPlugins: any[];
  rehypePlugins: any[];
}) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
      {value}
    </ReactMarkdown>
  );
};

const MemoPreview = React.memo(Preview, (prev, next) => prev.value === next.value);
