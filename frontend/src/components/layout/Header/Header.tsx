import { Layout, Typography, Button, Tag, Space } from 'antd';
import { BookOutlined, CloudServerOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { getHealth } from '@/services/health.service';
import type { HealthStatus } from '@/services/health.service';
import { Link } from 'react-router-dom';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const StyledHeader = styled(AntHeader)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StyledTitle = styled(Title)`
  margin: 0 !important;
  color: ${({ theme }) => theme.colors.textPrimary} !important;
  font-size: 24px !important;
  font-weight: 600 !important;
`;

const LogoIcon = styled(BookOutlined)`
  font-size: 28px;
  color: ${({ theme }) => theme.colors.primary};
`;

const NavSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const statusColor = (status: HealthStatus | 'unknown') => {
  switch (status) {
    case 'healthy':
      return 'green';
    case 'degraded':
      return 'orange';
    default:
      return 'default';
  }
};

export const Header = () => {
  const [status, setStatus] = useState<HealthStatus | 'unknown'>('unknown');

  useEffect(() => {
    getHealth()
      .then(res => setStatus(res.status))
      .catch(() => setStatus('unknown'));
  }, []);

  return (
    <StyledHeader>
      <LogoSection>
        <LogoIcon />
        <StyledTitle level={3}>Book to Course Converter</StyledTitle>
      </LogoSection>
      <NavSection>
        <Space size="middle">
          <Link to="/upload"><Button>Process PDF</Button></Link>
          <Tag icon={<CloudServerOutlined />} color={statusColor(status)}>
            {status === 'unknown' ? 'backend: n/a' : `backend: ${status}`}
          </Tag>
          <Link to="/"><Button type="primary">Get Started</Button></Link>
        </Space>
      </NavSection>
    </StyledHeader>
  );
};
