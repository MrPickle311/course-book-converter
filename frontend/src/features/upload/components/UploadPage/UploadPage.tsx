import { useMemo, useState } from 'react';
import { Upload, Typography, Card, Space, Button, message, Tree } from 'antd';
import { InboxOutlined, ApartmentOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import api from '@/services/api';
import { CourseView } from '../CourseView';

const { Dragger } = Upload;
const { Title, Paragraph, Text } = Typography;

const Container = styled.div`
  width: 100%;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg};
  min-height: calc(100vh - 120px);
`;

interface ChapterItem {
  title: string;
  level: number;
  startPage?: number;
  endPage?: number;
}

interface TreeNode {
  key: string;
  title: React.ReactNode;
  children?: TreeNode[];
}

const chapterNodeTitle = (c: ChapterItem, onGenerate?: (c: ChapterItem) => void) => (
  <Space size={6}>
    <Text strong>{c.title}</Text>
    {c.level === 1 && onGenerate && (
      <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); onGenerate(c); }}>
        Generate Course
      </Button>
    )}
  </Space>
);

function buildChapterTree(flat: ChapterItem[], onGenerate: (c: ChapterItem) => void): TreeNode[] {
  const items = [...flat];
  const roots: TreeNode[] = [];
  const stack: { level: number; node: TreeNode }[] = [];

  for (let i = 0; i < items.length; i++) {
    const c = items[i];
    const node: TreeNode = {
      key: `${i}-${c.title}`,
      title: chapterNodeTitle(c, onGenerate),
      children: [],
    };
    while (stack.length && stack[stack.length - 1].level >= c.level) stack.pop();
    if (stack.length === 0) roots.push(node);
    else (stack[stack.length - 1].node.children = (stack[stack.length - 1].node.children || [])).push(node);
    stack.push({ level: c.level, node });
  }
  const prune = (nodes: TreeNode[]): TreeNode[] => nodes.map(n => ({ ...n, children: n.children && n.children.length ? prune(n.children) : undefined }));
  return prune(roots);
}

export const UploadPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [module, setModule] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);

  const props = {
    name: 'file',
    multiple: false,
    accept: '.pdf,application/pdf',
    customRequest: async (options: any) => {
      const { file, onSuccess, onError } = options;
      const form = new FormData();
      form.append('file', file as File);
      setLoading(true);
      setResult(null);
      setModule(null);
      try {
        const res = await api.post('/api/v1/pdf/process', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 300000,
        });
        setResult(res.data?.data);
        onSuccess(res.data);
        message.success('PDF processed successfully');
      } catch (e: any) {
        const isTimeout = e?.code === 'ECONNABORTED' || /timeout/i.test(String(e?.message));
        const detail = isTimeout ? 'Processing took too long and timed out. Try a smaller file or disable extractions.' : e?.response?.data?.detail || e?.message || 'Upload failed';
        onError(e);
        message.error(detail);
      } finally {
        setLoading(false);
      }
    },
  };

  const handleGenerate = async (chapter: ChapterItem) => {
    try {
      if (!result?.uploadId) {
        message.error('Missing uploadId, re-upload PDF');
        return;
      }
      setGenerating(true);
      const resp = await api.post('/api/v1/course/generate', {
        chapterTitle: chapter.title,
        uploadId: result.uploadId,
        startPage: chapter.startPage ?? 0,
        endPage: typeof chapter.endPage === 'number' ? chapter.endPage : null,
      });
      const raw = resp.data?.data;
      const contents = [] as { type: 'text' | 'code' | 'picture' | 'table'; value: string }[];
      if (raw?.sections?.length) {
        raw.sections.forEach((s: any) => {
          contents.push({ type: 'text', value: s.summary || s.title });
        });
      } else if (raw?.objectives?.length) {
        contents.push({ type: 'text', value: raw.objectives.join('\n') });
      } else {
        contents.push({ type: 'text', value: chapter.title });
      }
      setModule({
        title: raw?.title || chapter.title,
        notes: { title: raw?.title || chapter.title, contents },
        tasks: { items: [{ title: 'Task 1 (stub)' }, { title: 'Task 2 (stub)' }] },
      });
      message.success('Course generated');
    } catch (e: any) {
      message.error(e?.message || 'Failed to generate course');
    } finally {
      setGenerating(false);
    }
  };

  const treeData = useMemo(() => {
    if (!result?.chapters) return [] as TreeNode[];
    const chapters: ChapterItem[] = result.chapters.map((c: any) => ({
      title: String(c.title || ''),
      level: Number(c.level || 1),
      startPage: typeof c.startPage === 'number' ? c.startPage : undefined,
      endPage: typeof c.endPage === 'number' ? c.endPage : undefined,
    }));
    return buildChapterTree(chapters, handleGenerate);
  }, [result]);

  return (
    <Container>
      <Title level={2} style={{ marginBottom: '1rem' }}>Process PDF</Title>
      <Paragraph type="secondary" style={{ marginBottom: '2rem' }}>
        Upload a PDF to analyze its structure, detect chapters, and extract a high-level summary.
      </Paragraph>

      <Dragger disabled={loading} {...props} style={{ padding: '24px' }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag PDF to this area to upload</p>
        <p className="ant-upload-hint">Only .pdf files are supported</p>
      </Dragger>

      {result && (
        <Card style={{ marginTop: '24px' }}>
          <Title level={4} style={{ marginBottom: '1rem' }}>Summary</Title>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small" title={<><ApartmentOutlined /> Chapter hierarchy</>}>
              {treeData.length ? (
                <Tree
                  treeData={treeData as any}
                  defaultExpandAll
                />
              ) : (
                <Text type="secondary">No chapter-like headings found</Text>
              )}
            </Card>

            {module && (
              <Card size="small" title={`Generated Course: ${module.title}`} loading={generating}>
                <CourseView data={module} />
              </Card>
            )}

            <Space>
              <Button type="primary" disabled>Generate Course (coming soon)</Button>
              <Button onClick={() => { setResult(null); setModule(null); }}>Process Another</Button>
            </Space>
          </Space>
        </Card>
      )}
    </Container>
  );
};
