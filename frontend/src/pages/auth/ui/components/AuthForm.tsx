import { theme, Card, Button, Input, Tabs, Divider, Flex, Typography, Alert } from 'antd';
import { GoogleSignIn } from '@/pages/auth/ui/components/GoogleSignIn.tsx';
import { ReadOutlined, MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthForm } from '@/pages/auth/ui/hooks/useAuthForm.ts';
import { getAuthStyles } from '../styles/styles.ts';

const { useToken } = theme;
const Text = Typography.Text;
const Title = Typography.Title;

function AuthForm() {
  const { token } = useToken();
  const styles = getAuthStyles(token);

  const {
    activeTab,
    formData,
    errors,
    submitError,
    isLoading,
    handleInputChange,
    handleSubmit,
    handleTabChange
  } = useAuthForm();

  const GoogleAuth = () =>
  <Flex vertical gap={16}>
    <GoogleSignIn mode={activeTab as 'login' | 'register'} />
    <Divider plain style={styles.divider}>
      Or continue with email
    </Divider>
  </Flex>;

  const RegistrationWindow = () =>
  <Flex vertical gap={16}>
    <Flex vertical gap={6}>
      <Text>Full Name</Text>
      <Input
          id="name"
          type="text"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          prefix={<UserOutlined style={styles.inputPrefix}/>}
          disabled={isLoading}
          status={errors.name ? 'error' : ''}
          size="large"
      />
      {errors.name && (
          <Text type="danger" style={styles.errorText}>
            {errors.name}
          </Text>
      )}
    </Flex>

    <Flex vertical gap={6}>
      <Text>Email</Text>
      <Input
          id="register-email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          prefix={<MailOutlined style={styles.inputPrefix}/>}
          disabled={isLoading}
          status={errors.email ? 'error' : ''}
          size="large"
      />
      {errors.email && (
          <Text type="danger" style={styles.errorText}>
            {errors.email}
          </Text>
      )}
    </Flex>

    <Flex vertical gap={6}>
      <Text>Password</Text>
      <Input.Password
          id="register-password"
          placeholder="Create a password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          prefix={<LockOutlined style={styles.inputPrefix}/>}
          disabled={isLoading}
          status={errors.password ? 'error' : ''}
          size="large"
      />
      {errors.password && (
          <Text type="danger" style={styles.errorText}>
            {errors.password}
          </Text>
      )}
    </Flex>

    <Flex vertical gap={6}>
      <Text>Confirm Password</Text>
      <Input.Password
          id="confirm-password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          prefix={<LockOutlined style={styles.inputPrefix}/>}
          disabled={isLoading}
          status={errors.confirmPassword ? 'error' : ''}
          size="large"
      />
      {errors.confirmPassword && (
          <Text type="danger" style={styles.errorText}>
            {errors.confirmPassword}
          </Text>
      )}
    </Flex>
  </Flex>;

  const DemoCredentialsModal = () =>
  <Card>
    <Flex vertical align="center" gap={8} style={{padding: 16}}>
      <Text type="secondary" style={{fontSize: '0.875rem'}}>
        Demo Credentials:
      </Text>
      <Flex vertical gap={4} style={{fontSize: '0.8rem', textAlign: 'center'}}>
        <Text>
          <strong>Email:</strong> john@example.com
        </Text>
        <Text>
          <strong>Password:</strong> password123
        </Text>
        <Text>
          <strong>Google:</strong> Click "Sign in with Google (Demo)"
        </Text>
      </Flex>
    </Flex>
  </Card>;

  const LoginWindow = () =>
  <Flex vertical gap={16}>
    <Flex vertical gap={6}>
      <Text>Email</Text>
      <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          prefix={<MailOutlined style={styles.inputPrefix}/>}
          disabled={isLoading}
          status={errors.email ? 'error' : ''}
          size="large"
      />
      {errors.email && (
          <Text type="danger" style={styles.errorText}>
            {errors.email}
          </Text>
      )}
    </Flex>

    <Flex vertical gap={6}>
      <Text>Password</Text>
      <Input.Password
          id="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          prefix={<LockOutlined style={styles.inputPrefix}/>}
          disabled={isLoading}
          status={errors.password ? 'error' : ''}
          size="large"
      />
      {errors.password && (
          <Text type="danger" style={styles.errorText}>
            {errors.password}
          </Text>
      )}
    </Flex>
  </Flex>;

  const EmailPasswordForm = () =>
  <form onSubmit={handleSubmit}>
    <Flex vertical gap={16}>
      {activeTab === 'login' && <LoginWindow/>}
      {activeTab === 'register' && <RegistrationWindow/>}
      {submitError && (
          <Alert message={submitError} type="error" showIcon/>
      )}
      <Button type="primary" htmlType="submit" size="large" block loading={isLoading} disabled={isLoading}>
        {activeTab === 'login' ? 'Sign In with Email' : 'Create Account with Email'}
      </Button>
    </Flex>
  </form>;

  const LogoBrand = () =>
  <Flex vertical align="center" gap={8} style={styles.logoContainer}>
    <Flex
        align="center"
        justify="center"
        style={styles.logoIconWrapper}
    >
      <ReadOutlined style={styles.logoIcon}/>
    </Flex>
    <Title level={3} style={styles.title}>
      PDF Course Generator
    </Title>
    <Text type="secondary" style={{fontSize: '0.9rem'}}>
      Transform technical books into interactive learning experiences
    </Text>
  </Flex>;

  return (
    <Flex
        vertical
        align="center"
        justify="center"
        style={styles.container}
    >
      <Flex vertical gap={24} style={styles.wrapper}>
        <LogoBrand/>
        <Card title={<div style={styles.cardTitle}>{activeTab === 'login' ? 'Welcome Back' : 'Create Account'}</div>}>
          <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              centered
              items={[
                {key: "login", label: "Sign In"},
                {key: "register", label: "Sign Up"},
              ]}
          />

          <Flex vertical gap={24} style={styles.formContainer}>
            <GoogleAuth/>
            <EmailPasswordForm/>
          </Flex>
        </Card>
        <DemoCredentialsModal/>
      </Flex>
    </Flex>
  );
}

export default AuthForm