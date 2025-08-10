import { Layout as AntLayout } from 'antd';
import styled from 'styled-components';
import { Header } from '../Header';
import { Footer } from '../Footer';

const { Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const StyledLayout = styled(AntLayout)`
  min-height: 100vh;
`;

const StyledContent = styled(Content)`
  padding: ${({ theme }) => theme.spacing.lg};
  margin: 0;
  min-height: calc(100vh - 64px - 70px); /* Subtract header and footer height */
  background: ${({ theme }) => theme.colors.background};
`;

export const Layout = ({ children }: LayoutProps) => {
  return (
    <StyledLayout>
      <Header />
      <StyledContent>{children}</StyledContent>
      <Footer />
    </StyledLayout>
  );
};
