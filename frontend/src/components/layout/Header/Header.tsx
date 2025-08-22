import { Layout, Typography, Button } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import styled from 'styled-components';
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

export const Header = () => {
  return (
    <StyledHeader>
      <LogoSection>
        <LogoIcon />
        <StyledTitle level={3}>Book to Course Converter</StyledTitle>
      </LogoSection>
      <NavSection>
        <Link to="/"><Button type="primary">Get Started</Button></Link>
      </NavSection>
    </StyledHeader>
  );
};
