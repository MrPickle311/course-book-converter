import { useMemo, useState } from 'react';
import { Upload, Typography, Card, Space, Button, message, Tree, Tag, Divider } from 'antd';
import { InboxOutlined, ApartmentOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import api from '@/services/api';
import type { CourseModule } from '@/services/course.service';

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
    {typeof c.startPage === 'number' && (
      <Tag>
        p.{(c.startPage ?? 0) + 1}
        {typeof c.endPage === 'number' ? ` - p.${(c.endPage ?? 0) + 1}` : ''}
      </Tag>
    )}
    {c.level === 1 && onGenerate && (
      <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); onGenerate(c); }}>
        Generate Course
      </Button>
    )}
  </Space>
);

function buildChapterTree(flat: ChapterItem[], onGenerate: (c: ChapterItem) => void): TreeNode[] {
  // Sort by startPage then level
  const items = [...flat].sort((a, b) => (a.startPage ?? 0) - (b.startPage ?? 0) || a.level - b.level);
  const roots: TreeNode[] = [];
  const stack: { level: number; node: TreeNode }[] = [];

  for (let i = 0; i < items.length; i++) {
    const c = items[i];
    const node: TreeNode = {
      key: `${i}-${c.title}`,
      title: chapterNodeTitle(c, onGenerate),
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
  const [module, setModule] = useState<CourseModule | null>(null);
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
      setModule(resp.data?.data);
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
                {module.objectives?.length ? (
                  <>
                    <Title level={5}>Objectives</Title>
                    <ul>
                      {module.objectives.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                    <Divider />
                  </>
                ) : null}

                {module.sections?.length ? (
                  <>
                    <Title level={5}>Sections</Title>
                    {module.sections.map((s, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <strong>{s.title}</strong>
                        <div style={{ margin: '4px 0' }}>{s.summary}</div>
                        {s.keyConcepts?.length ? (
                          <div>
                            {s.keyConcepts.map((k, idx) => <Tag key={idx}>{k}</Tag>)}
                          </div>
                        ) : null}
                      </div>
                    ))}
                    <Divider />
                  </>
                ) : null}

                {module.tasks?.length ? (
                  <>
                    <Title level={5}>Tasks</Title>
                    {module.tasks.map((t, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <strong>{t.type}: {t.title}</strong>
                        <div style={{ margin: '4px 0' }}>{t.description}</div>
                        {t.successCriteria?.length ? (
                          <ul>
                            {t.successCriteria.map((c, j) => <li key={j}>{c}</li>)}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </>
                ) : null}
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
