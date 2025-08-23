import { useMemo, useState } from 'react';
import { Upload, Typography, Card, Space, Button, message, Tree, Tag } from 'antd';
import { InboxOutlined, ApartmentOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import api from '@/services/api';

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

const chapterNodeTitle = (c: ChapterItem) => (
  <Space size={6}>
    <Text strong>{c.title}</Text>
    {typeof c.startPage === 'number' && (
      <Tag>
        p.{(c.startPage ?? 0) + 1}
        {typeof c.endPage === 'number' ? ` - p.${(c.endPage ?? 0) + 1}` : ''}
      </Tag>
    )}
  </Space>
);

function buildChapterTree(flat: ChapterItem[]): TreeNode[] {
  // Sort by startPage then level
  const items = [...flat].sort((a, b) => (a.startPage ?? 0) - (b.startPage ?? 0) || a.level - b.level);
  const roots: TreeNode[] = [];
  const stack: { level: number; node: TreeNode }[] = [];

  for (let i = 0; i < items.length; i++) {
    const c = items[i];
    const node: TreeNode = {
      key: `${i}-${c.title}`,
      title: chapterNodeTitle(c),
      children: [],
    };

    // find parent with lower level
    while (stack.length && stack[stack.length - 1].level >= c.level) stack.pop();

    if (stack.length === 0) {
      roots.push(node);
    } else {
      const parent = stack[stack.length - 1].node;
      parent.children = parent.children || [];
      parent.children.push(node);
    }

    stack.push({ level: c.level, node });
  }

  // prune empty children arrays for nicer rendering
  const prune = (nodes: TreeNode[]): TreeNode[] =>
    nodes.map(n => ({ ...n, children: n.children && n.children.length ? prune(n.children) : undefined }));

  return prune(roots);
}

export const UploadPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

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
      try {
        const res = await api.post('/api/v1/pdf/process', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 300000, // 5 minutes for long PDFs
        });
        setResult(res.data?.data);
        onSuccess(res.data);
        message.success('PDF processed successfully');
      } catch (e: any) {
        const isTimeout = e?.code === 'ECONNABORTED' || /timeout/i.test(String(e?.message));
        const detail = isTimeout
          ? 'Processing took too long and timed out. Try a smaller file or disable extractions.'
          : e?.response?.data?.detail || e?.message || 'Upload failed';
        onError(e);
        message.error(detail);
      } finally {
        setLoading(false);
      }
    },
  };

  const treeData = useMemo(() => {
    if (!result?.chapters) return [] as TreeNode[];
    const chapters: ChapterItem[] = result.chapters.map((c: any) => ({
      title: String(c.title || ''),
      level: Number(c.level || 1),
      startPage: typeof c.startPage === 'number' ? c.startPage : undefined,
      endPage: typeof c.endPage === 'number' ? c.endPage : undefined,
    }));
    return buildChapterTree(chapters);
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

            <Space>
              <Button type="primary" disabled>Generate Course (coming soon)</Button>
              <Button onClick={() => setResult(null)}>Process Another</Button>
            </Space>
          </Space>
        </Card>
      )}
    </Container>
  );
};
