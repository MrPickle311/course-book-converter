import { theme, Card, Button, Input, Tabs, Divider, Flex, Typography, Alert } from 'antd';
import { GoogleSignIn } from './components/GoogleSignIn';
import { ReadOutlined, MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthForm } from './hooks/useAuthForm';
import { getAuthStyles } from './styles';

const { useToken } = theme;

export function AuthForm() {
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

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      style={styles.container}
    >
      <Flex vertical gap={24} style={styles.wrapper}>
        {/* Logo/Brand */}
        <Flex vertical align="center" gap={8} style={styles.logoContainer}>
          <Flex
            align="center"
            justify="center"
            style={styles.logoIconWrapper}
          >
            <ReadOutlined style={styles.logoIcon} />
          </Flex>
          <Typography.Title level={3} style={styles.title}>
            PDF Course Generator
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Transform technical books into interactive learning experiences
          </Typography.Text>
        </Flex>

        <Card title={<div style={styles.cardTitle}>{activeTab === 'login' ? 'Welcome Back' : 'Create Account'}</div>}>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            centered
            items={[
              { key: "login", label: "Sign In" },
              { key: "register", label: "Sign Up" },
            ]}
          />

          <Flex vertical gap={24} style={styles.formContainer}>
            {/* Google Sign-In Section */}
            <Flex vertical gap={16}>
              <GoogleSignIn mode={activeTab as 'login' | 'register'} />
              <Divider plain style={styles.divider}>
                Or continue with email
              </Divider>
            </Flex>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit}>
              <Flex vertical gap={16}>
                {activeTab === 'login' && (
                  <Flex vertical gap={16}>
                    <Flex vertical gap={6}>
                      <label htmlFor="email" style={{ fontSize: '14px', fontWeight: 500 }}>Email</label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        prefix={<MailOutlined style={styles.inputPrefix} />}
                        disabled={isLoading}
                        status={errors.email ? 'error' : ''}
                        size="large"
                      />
                      {errors.email && (
                        <Typography.Text type="danger" style={styles.errorText}>
                          {errors.email}
                        </Typography.Text>
                      )}
                    </Flex>

                    <Flex vertical gap={6}>
                      <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 500 }}>Password</label>
                      <Input.Password
                        id="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        prefix={<LockOutlined style={styles.inputPrefix} />}
                        disabled={isLoading}
                        status={errors.password ? 'error' : ''}
                        size="large"
                      />
                      {errors.password && (
                        <Typography.Text type="danger" style={styles.errorText}>
                          {errors.password}
                        </Typography.Text>
                      )}
                    </Flex>
                  </Flex>
                )}

                {activeTab === 'register' && (
                  <Flex vertical gap={16}>
                    <Flex vertical gap={6}>
                      <label htmlFor="name" style={{ fontSize: '14px', fontWeight: 500 }}>Full Name</label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        prefix={<UserOutlined style={styles.inputPrefix} />}
                        disabled={isLoading}
                        status={errors.name ? 'error' : ''}
                        size="large"
                      />
                      {errors.name && (
                        <Typography.Text type="danger" style={styles.errorText}>
                          {errors.name}
                        </Typography.Text>
                      )}
                    </Flex>

                    <Flex vertical gap={6}>
                      <label htmlFor="register-email" style={{ fontSize: '14px', fontWeight: 500 }}>Email</label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        prefix={<MailOutlined style={styles.inputPrefix} />}
                        disabled={isLoading}
                        status={errors.email ? 'error' : ''}
                        size="large"
                      />
                      {errors.email && (
                        <Typography.Text type="danger" style={styles.errorText}>
                          {errors.email}
                        </Typography.Text>
                      )}
                    </Flex>

                    <Flex vertical gap={6}>
                      <label htmlFor="register-password" style={{ fontSize: '14px', fontWeight: 500 }}>Password</label>
                      <Input.Password
                        id="register-password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        prefix={<LockOutlined style={styles.inputPrefix} />}
                        disabled={isLoading}
                        status={errors.password ? 'error' : ''}
                        size="large"
                      />
                      {errors.password && (
                        <Typography.Text type="danger" style={styles.errorText}>
                          {errors.password}
                        </Typography.Text>
                      )}
                    </Flex>

                    <Flex vertical gap={6}>
                      <label htmlFor="confirm-password" style={{ fontSize: '14px', fontWeight: 500 }}>Confirm Password</label>
                      <Input.Password
                        id="confirm-password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        prefix={<LockOutlined style={styles.inputPrefix} />}
                        disabled={isLoading}
                        status={errors.confirmPassword ? 'error' : ''}
                        size="large"
                      />
                      {errors.confirmPassword && (
                        <Typography.Text type="danger" style={styles.errorText}>
                          {errors.confirmPassword}
                        </Typography.Text>
                      )}
                    </Flex>
                  </Flex>
                )}

                {submitError && (
                  <Alert message={submitError} type="error" showIcon />
                )}

                <Button type="primary" htmlType="submit" size="large" block loading={isLoading} disabled={isLoading}>
                  {activeTab === 'login' ? 'Sign In with Email' : 'Create Account with Email'}
                </Button>
              </Flex>
            </form>
          </Flex>
        </Card>

        {/* Demo credentials */}
        <Card>
          <Flex vertical align="center" gap={8} style={{ padding: 16 }}>
            <Typography.Text type="secondary" style={{ fontSize: '0.875rem' }}>
              Demo Credentials:
            </Typography.Text>
            <Flex vertical gap={4} style={{ fontSize: '0.8rem', textAlign: 'center' }}>
              <Typography.Text>
                <strong>Email:</strong> john@example.com
              </Typography.Text>
              <Typography.Text>
                <strong>Password:</strong> password123
              </Typography.Text>
              <Typography.Text>
                <strong>Google:</strong> Click "Sign in with Google (Demo)"
              </Typography.Text>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Flex>
  );
}