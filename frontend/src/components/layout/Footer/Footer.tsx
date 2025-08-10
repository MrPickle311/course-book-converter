import { Layout, Typography } from 'antd';
import styled from 'styled-components';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

const StyledFooter = styled(AntFooter)`
  text-align: center;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const FooterText = styled(Text)`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <StyledFooter>
      <FooterText>
        © {currentYear} Book to Course Converter. Transform your PDFs into interactive learning experiences.
      </FooterText>
    </StyledFooter>
  );
};
