import { Typography, Button, Card, Row, Col } from 'antd';
import {
  BookOutlined,
  BulbOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Paragraph } = Typography;

const HeroSection = styled.section`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const HeroTitle = styled(Title)`
  font-size: 3.5rem !important;
  font-weight: 700 !important;
  margin-bottom: ${({ theme }) => theme.spacing.lg} !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 2.5rem !important;
  }
`;

const HeroDescription = styled(Paragraph)`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 600px;
  margin: 0 auto ${({ theme }) => theme.spacing.xl};
`;

const FeatureCard = styled(Card)`
  height: 100%;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const StepsSection = styled.section`
  margin: ${({ theme }) => theme.spacing.xxl} 0;
`;

const StepCard = styled(Card)`
  text-align: center;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 2px solid ${({ theme }) => theme.colors.borderSecondary};
`;

const StepNumber = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.5rem;
  margin: 0 auto ${({ theme }) => theme.spacing.md};
`;

export const HomePage = () => {
  const features = [
    {
      icon: <BookOutlined />,
      title: 'Smart PDF Processing',
      description:
        "Advanced text extraction and structure analysis that understands your book's organization and content.",
    },
    {
      icon: <BulbOutlined />,
      title: 'AI-Powered Course Generation',
      description:
        'Transform book content into structured courses with learning objectives and practical exercises.',
    },
    {
      icon: <PlayCircleOutlined />,
      title: 'Interactive Tasks',
      description:
        'Multi-modal exercises including coding challenges, writing tasks, and file upload projects.',
    },
    {
      icon: <CheckCircleOutlined />,
      title: 'Chapter-Based Pricing',
      description:
        'Flexible monetization with per-chapter access control and pricing.',
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Upload Your Book',
      description:
        'Upload your PDF book and let our AI analyze its structure and content.',
    },
    {
      number: 2,
      title: 'AI Analysis',
      description:
        'Our advanced AI processes your book to understand concepts and learning objectives.',
    },
    {
      number: 3,
      title: 'Course Generation',
      description:
        'Automatically generate interactive courses with tasks and exercises.',
    },
    {
      number: 4,
      title: 'Start Learning',
      description:
        'Access your personalized course with progress tracking and assessments.',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <HeroSection>
        <HeroTitle>Transform Books into Interactive Courses</HeroTitle>
        <HeroDescription>
          Convert your PDF books into engaging, AI-generated courses with
          practical exercises and interactive learning experiences. Perfect for
          educators, students, and lifelong learners.
        </HeroDescription>
        <Button type="primary" size="large">
          Start Converting Now
        </Button>
      </HeroSection>

      {/* Features Section */}
      <section>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '3rem' }}>
          Powerful Features
        </Title>
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <FeatureCard>
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <Title level={4}>{feature.title}</Title>
                <Paragraph>{feature.description}</Paragraph>
              </FeatureCard>
            </Col>
          ))}
        </Row>
      </section>

      {/* How It Works Section */}
      <StepsSection>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '3rem' }}>
          How It Works
        </Title>
        <Row gutter={[24, 24]}>
          {steps.map((step, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <StepCard>
                <StepNumber>{step.number}</StepNumber>
                <Title level={4}>{step.title}</Title>
                <Paragraph>{step.description}</Paragraph>
              </StepCard>
            </Col>
          ))}
        </Row>
      </StepsSection>
    </div>
  );
};
