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
  background: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 16px 0;
`;

const Card = styled.div`
  background: #c17474; /* keep provided mixed colors */
  color: #000;
  border-radius: 4px;
  padding: 28px;
  text-align: center;
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
  background: ${({ active }) => (active ? '#333' : '#bbb')};
  display: inline-block;
`;

function renderContent(c: NoteContent, i: number) {
  switch (c.type) {
    case 'text':
      return <Card key={i}>CONTENT</Card>;
    case 'code':
      return <Card key={i}>CONTENT</Card>;
    case 'picture':
      return <Card key={i}>CONTENT</Card>;
    case 'table':
      return <Card key={i}>CONTENT</Card>;
    default:
      return <Card key={i}>CONTENT</Card>;
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
          {Array.from({ length: Math.max(1, taskCount || 2) }).map((_, idx) => (
            <Card key={idx}>TASK</Card>
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
