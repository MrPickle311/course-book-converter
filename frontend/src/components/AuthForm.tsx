import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert } from './ui/alert';
import { Tabs, Divider, Flex, Typography, Spin } from 'antd';
import { GoogleSignIn } from './GoogleSignIn';
import { useAuth } from './AuthContext';
import { BookOpen, Mail, Lock, User, AlertCircle } from 'lucide-react';

export function AuthForm() {
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
      style={{ minHeight: '100vh', backgroundColor: 'var(--background)', padding: '0 1rem' }}
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
              backgroundColor: '#eef2ff',
              margin: '0 auto',
            }}
          >
            <BookOpen style={{ width: 32, height: 32, color: '#4f46e5' }} />
          </Flex>
          <Typography.Title level={3} style={{ margin: 0 }}>
            PDF Course Generator
          </Typography.Title>
          <Typography.Text style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
            Transform technical books into interactive learning experiences
          </Typography.Text>
        </Flex>

        <Card>
          <CardHeader>
            <CardTitle style={{ textAlign: 'center' }}>
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              className="bcc-tabs bcc-tabs--underline"
              activeKey={activeTab}
              onChange={handleTabChange}
              items={[
                { key: "login", label: "Sign In" },
                { key: "register", label: "Sign Up" },
              ]}
            />

              <Flex vertical gap={24} style={{ marginTop: 24 }}>
                {/* Google Sign-In Section */}
                <Flex vertical gap={16}>
                  <GoogleSignIn mode={activeTab as 'login' | 'register'} />
                  <Divider plain style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Or continue with email
                  </Divider>
                </Flex>

                {/* Email/Password Form */}
                <form onSubmit={handleSubmit}>
                  <Flex vertical gap={16}>
                  {activeTab === 'login' && (
                  <Flex vertical gap={16}>
                    <Flex vertical gap={8}>
                      <Label htmlFor="email">Email</Label>
                      <Flex style={{ position: 'relative' }}>
                        <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          style={{ paddingLeft: 36 }}
                          disabled={isLoading}
                        />
                      </Flex>
                      {errors.email && (
                        <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--destructive)' }}>
                          {errors.email}
                        </Typography.Text>
                      )}
                    </Flex>

                    <Flex vertical gap={8}>
                      <Label htmlFor="password">Password</Label>
                      <Flex style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          style={{ paddingLeft: 36 }}
                          disabled={isLoading}
                        />
                      </Flex>
                      {errors.password && (
                        <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--destructive)' }}>
                          {errors.password}
                        </Typography.Text>
                      )}
                    </Flex>
                  </Flex>
                  )}

                  {activeTab === 'register' && (
                  <Flex vertical gap={16}>
                    <Flex vertical gap={8}>
                      <Label htmlFor="name">Full Name</Label>
                      <Flex style={{ position: 'relative' }}>
                        <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          style={{ paddingLeft: 36 }}
                          disabled={isLoading}
                        />
                      </Flex>
                      {errors.name && (
                        <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--destructive)' }}>
                          {errors.name}
                        </Typography.Text>
                      )}
                    </Flex>

                    <Flex vertical gap={8}>
                      <Label htmlFor="register-email">Email</Label>
                      <Flex style={{ position: 'relative' }}>
                        <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          style={{ paddingLeft: 36 }}
                          disabled={isLoading}
                        />
                      </Flex>
                      {errors.email && (
                        <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--destructive)' }}>
                          {errors.email}
                        </Typography.Text>
                      )}
                    </Flex>

                    <Flex vertical gap={8}>
                      <Label htmlFor="register-password">Password</Label>
                      <Flex style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          style={{ paddingLeft: 36 }}
                          disabled={isLoading}
                        />
                      </Flex>
                      {errors.password && (
                        <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--destructive)' }}>
                          {errors.password}
                        </Typography.Text>
                      )}
                    </Flex>

                    <Flex vertical gap={8}>
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Flex style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          style={{ paddingLeft: 36 }}
                          disabled={isLoading}
                        />
                      </Flex>
                      {errors.confirmPassword && (
                        <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--destructive)' }}>
                          {errors.confirmPassword}
                        </Typography.Text>
                      )}
                    </Flex>
                  </Flex>
                  )}

                  {submitError && (
                    <Alert variant="destructive">
                      <AlertCircle style={{ width: 16, height: 16 }} />
                      <Typography.Text style={{ fontSize: '0.875rem' }}>{submitError}</Typography.Text>
                    </Alert>
                  )}

                  <Button htmlType="submit" style={{ width: '100%' }} disabled={isLoading}>
                    {isLoading ? (
                      <Flex align="center" gap={8} justify="center">
                        <Spin size="small" />
                        {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                      </Flex>
                    ) : (
                      activeTab === 'login' ? 'Sign In with Email' : 'Create Account with Email'
                    )}
                  </Button>
                  </Flex>
                </form>
              </Flex>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <Card>
          <CardContent style={{ padding: 16 }}>
            <Flex vertical align="center" gap={8}>
              <Typography.Text style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
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
          </CardContent>
        </Card>
      </Flex>
    </Flex>
  );
}