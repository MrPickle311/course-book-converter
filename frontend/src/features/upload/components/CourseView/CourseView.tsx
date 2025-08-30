import React from 'react';
import styled from 'styled-components';
import { Typography, Space } from 'antd';

const { Title } = Typography;

export type NoteContentType = 'text' | 'code' | 'picture' | 'table';

export interface NoteContent {
  type: NoteContentType;
  value: string; // for picture/table we keep url or markdown-like source for now
}

export interface CourseNotes {
  title: string;
  contents: NoteContent[];
}

export interface CourseTasksStub {
  items: { title: string }[];
}

export interface CourseData {
  title: string;
  notes: CourseNotes;
  tasks: CourseTasksStub;
}

const Wrapper = styled.div`
  width: 100%;
`;

const Section = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSecondary};
  padding: ${({ theme }) => theme.spacing.lg} 0;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};
  border: 1px solid ${({ theme }) => theme.colors.borderSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: left;
  line-height: 1.7;
  white-space: pre-wrap;
`;

const Code = styled.pre`
  background: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.textPrimary};
  border: 1px solid ${({ theme }) => theme.colors.borderSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  overflow-x: auto;
`;

const Picture = styled.img`
  max-width: 100%;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.borderSecondary};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: block;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.background};
  th, td { border: 1px solid ${({ theme }) => theme.colors.borderSecondary}; padding: ${({ theme }) => theme.spacing.sm}; }
  th { background: ${({ theme }) => theme.colors.backgroundSecondary}; text-align: left; }
  tbody tr:nth-child(even) { background: ${({ theme }) => theme.colors.backgroundSecondary}; }
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 8px 0;
`;

const Dot = styled.span<{ active?: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ active, theme }) => (active ? theme.colors.gray700 : theme.colors.gray300)};
  display: inline-block;
`;

function renderContent(c: NoteContent, i: number) {
  switch (c.type) {
    case 'text':
      return <Card key={i}>{c.value}</Card>;
    case 'code':
      return (
        <Card key={i}>
          <Code>{c.value}</Code>
        </Card>
      );
    case 'picture': {
      const src = c.value;
      return (
        <Card key={i}>
          <Picture src={src} alt="illustration" />
        </Card>
      );
    }
    case 'table': {
      try {
        const parsed = JSON.parse(c.value) as { headers: string[]; rows: string[][] };
        return (
          <Card key={i}>
            <Table>
              <thead>
                <tr>
                  {parsed.headers.map((h, idx) => (<th key={idx}>{h}</th>))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, cidx) => (<td key={cidx}>{cell}</td>))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        );
      } catch {
        return <Card key={i}>{c.value}</Card>;
      }
    }
    default:
      return <Card key={i}>{c.value}</Card>;
  }
}

export const CourseView: React.FC<{ data: CourseData }> = ({ data }) => {
  const noteCount = data.notes?.contents?.length || 0;
  const taskCount = data.tasks?.items?.length || 0;
  return (
    <Wrapper>
      <Title level={4} style={{ marginBottom: 12 }}>Generated Course: {data.title}</Title>

      <Section>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {data.notes?.contents?.map(renderContent)}
        </Space>
        <Dots>
          {Array.from({ length: Math.max(1, noteCount) }).map((_, idx) => (
            <Dot key={idx} active={idx === 0} />
          ))}
        </Dots>
      </Section>

      <Section>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {data.tasks?.items?.map((t, idx) => (
            <Card key={idx}><strong>Task:</strong> {t.title}</Card>
          ))}
        </Space>
        <Dots>
          {Array.from({ length: Math.max(1, taskCount || 2) }).map((_, idx) => (
            <Dot key={idx} active={idx === 0} />
          ))}
        </Dots>
      </Section>
    </Wrapper>
  );
};
