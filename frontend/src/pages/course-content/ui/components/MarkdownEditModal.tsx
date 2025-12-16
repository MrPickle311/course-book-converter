import React, { useMemo } from 'react';
import { Modal, Row, Col, Typography, Input, Button, theme, Flex } from 'antd';
import ReactMarkdown from 'react-markdown';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { MdxStyles } from '../styles/MdxStyles.tsx';
import { getEditorStyles } from '../styles/editorStyles.ts';
import { useMarkdownEditor } from '../hooks/useMarkdownEditModal.ts';

interface MarkdownEditModalProps {
  open: boolean;
  title?: string;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

interface EditorColumnProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onScroll: () => void;
  textareaRef: React.RefObject<TextAreaRef>;
  styles: ReturnType<typeof getEditorStyles>;
}

interface PreviewColumnProps {
  previewRef: React.RefObject<HTMLDivElement>;
  renderValue: string;
  remarkPlugins: any[];
  rehypePlugins: any[];
  styles: ReturnType<typeof getEditorStyles>;
}

const EditorColumn = (props: EditorColumnProps) => {
  return (
    <Col span={12} style={props.styles.columnLeft}>
      <Flex style={props.styles.header}>
        <Typography.Text
            type="secondary"
            style={{ fontSize: '0.85rem' }}>
            Markdown
        </Typography.Text>
      </Flex>
      <Flex style={{ flex: 1, minHeight: 0 }}>
        <Input.TextArea
          ref={props.textareaRef}
          value={props.value}
          onChange={props.onChange}
          onScroll={props.onScroll}
          spellCheck={false}
          autoSize={false}
          style={props.styles.textArea}
        />
      </Flex>
    </Col>
  );
};

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

const PreviewColumn = (props: PreviewColumnProps) => {
  return (
    <Col span={12} style={props.styles.columnRight}>
      <Flex style={props.styles.header}>
        <Typography.Text
            type="secondary"
            style={{ fontSize: '0.85rem' }}>
            Preview
        </Typography.Text>
      </Flex>
      <div
        ref={props.previewRef}
        className="bcc-preview-scroll"
        style={props.styles.previewContainer}
      >
        <div className="mdx-content">
          <MemoPreview
            value={props.renderValue}
            remarkPlugins={props.remarkPlugins}
            rehypePlugins={props.rehypePlugins}
          />
        </div>
      </div>
    </Col>
  );
};

export function MarkdownEditModal(props: MarkdownEditModalProps) {
  const { token } = theme.useToken();
  const styles = useMemo(() => getEditorStyles(token), [token]);

  const {
    value,
    deferredRenderValue,
    textareaRef,
    previewRef,
    handleTextChange,
    handleLeftScroll,
    remarkPlugins,
    rehypePlugins
  } = useMarkdownEditor(props);

  if (!props.open) {
    return null;
  }

  return (
    <>
      <MdxStyles token={token} />
      <style>{`
        .bcc-preview-scroll::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>
      <Modal
        open={props.open}
        title={props.title}
        onCancel={props.onClose}
        width="96vw"
        style={{ top: 8 }}
        styles={{ body: styles.modalBody }}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={props.onClose}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={() => props.onSave(value)}>
            Save
          </Button>,
        ]}
      >
        <Row gutter={0} style={{ height: '100%' }}>
          <EditorColumn
            value={value}
            onChange={handleTextChange}
            onScroll={handleLeftScroll}
            textareaRef={textareaRef}
            styles={styles}
          />
          <PreviewColumn
            previewRef={previewRef}
            renderValue={deferredRenderValue}
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            styles={styles}
          />
        </Row>
      </Modal>
    </>
  );
}

