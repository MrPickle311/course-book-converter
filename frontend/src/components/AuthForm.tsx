import { useState } from 'react';
import { Card, Button, Input, Tabs, Divider, Flex, Typography, Alert, theme } from 'antd';
import { GoogleSignIn } from './GoogleSignIn';
import { useAuth } from './AuthContext';
import { ReadOutlined, MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';

const { useToken } = theme;

export function AuthForm() {
  const { token } = useToken();
  const { login, register, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setSubmitError('');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (activeTab === 'register') {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let result;
      if (activeTab === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.name, formData.email, formData.password);
      }

      if (!result.success && result.error) {
        setSubmitError(result.error);
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setSubmitError('');
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    resetForm();
  };

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      style={{ minHeight: '100vh', backgroundColor: token.colorBgLayout, padding: '0 1rem' }}
    >
      <Flex vertical gap={24} style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo/Brand */}
        <Flex vertical align="center" gap={8} style={{ textAlign: 'center' }}>
          <Flex
            align="center"
            justify="center"
            style={{
              width: 64,
              height: 64,
              borderRadius: 24,
              backgroundColor: token.colorPrimaryBg,
              margin: '0 auto',
            }}
          >
            <ReadOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
          </Flex>
          <Typography.Title level={3} style={{ margin: 0 }}>
            PDF Course Generator
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: '0.9rem' }}>
            Transform technical books into interactive learning experiences
          </Typography.Text>
        </Flex>

        <Card title={<div style={{ textAlign: 'center' }}>{activeTab === 'login' ? 'Welcome Back' : 'Create Account'}</div>}>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            centered
            items={[
              { key: "login", label: "Sign In" },
              { key: "register", label: "Sign Up" },
            ]}
          />

          <Flex vertical gap={24} style={{ marginTop: 24 }}>
            {/* Google Sign-In Section */}
            <Flex vertical gap={16}>
              <GoogleSignIn mode={activeTab as 'login' | 'register'} />
              <Divider plain style={{ fontSize: '0.75rem', color: token.colorTextSecondary, margin: 0 }}>
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
                        prefix={<MailOutlined style={{ color: token.colorTextQuaternary }} />}
                        disabled={isLoading}
                        status={errors.email ? 'error' : ''}
                        size="large"
                      />
                      {errors.email && (
                        <Typography.Text type="danger" style={{ fontSize: '0.875rem' }}>
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
                        prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />}
                        disabled={isLoading}
                        status={errors.password ? 'error' : ''}
                        size="large"
                      />
                      {errors.password && (
                        <Typography.Text type="danger" style={{ fontSize: '0.875rem' }}>
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
                        prefix={<UserOutlined style={{ color: token.colorTextQuaternary }} />}
                        disabled={isLoading}
                        status={errors.name ? 'error' : ''}
                        size="large"
                      />
                      {errors.name && (
                        <Typography.Text type="danger" style={{ fontSize: '0.875rem' }}>
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
                        prefix={<MailOutlined style={{ color: token.colorTextQuaternary }} />}
                        disabled={isLoading}
                        status={errors.email ? 'error' : ''}
                        size="large"
                      />
                      {errors.email && (
                        <Typography.Text type="danger" style={{ fontSize: '0.875rem' }}>
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
                        prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />}
                        disabled={isLoading}
                        status={errors.password ? 'error' : ''}
                        size="large"
                      />
                      {errors.password && (
                        <Typography.Text type="danger" style={{ fontSize: '0.875rem' }}>
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
                        prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />}
                        disabled={isLoading}
                        status={errors.confirmPassword ? 'error' : ''}
                        size="large"
                      />
                      {errors.confirmPassword && (
                        <Typography.Text type="danger" style={{ fontSize: '0.875rem' }}>
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