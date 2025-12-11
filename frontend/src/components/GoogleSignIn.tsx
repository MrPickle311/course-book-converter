import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Button, Flex, App } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

// Google Identity Services types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInProps {
  mode: 'login' | 'register';
}

export function GoogleSignIn({ mode }: GoogleSignInProps) {
  const { loginWithGoogle, isLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (window.google) {
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleSignIn();
      };
      document.head.appendChild(script);
    };

    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: 'YOUR_GOOGLE_CLIENT_ID_HERE', // Replace with your actual Google Client ID
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };

    loadGoogleScript();
  }, []);

  const handleGoogleSignIn = async (response: any) => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(response);
    } catch (error) {
      console.error('Google sign-in error:', error);
      message.error('Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Demo function to simulate Google sign-in without real Google setup
  const handleDemoGoogleSignIn = async () => {
    setIsGoogleLoading(true);

    // Simulate Google credential response
    const mockGoogleCredential = {
      credential: createMockJWT()
    };

    try {
      await loginWithGoogle(mockGoogleCredential);
    } catch (error) {
      console.error('Demo Google sign-in error:', error);
      message.error('Demo Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Create a mock JWT token for demo purposes
  const createMockJWT = () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: '1234567890',
      name: 'Demo User',
      email: 'demo.google@example.com',
      picture: 'https://via.placeholder.com/150',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }));
    const signature = btoa('mock-signature');
    return `${header}.${payload}.${signature}`;
  };

  const buttonText = mode === 'login' ? 'Sign in with Google' : 'Sign up with Google';

  return (
    <Flex vertical gap={12}>
      {/* Real Google Sign-In Button (hidden in demo) */}
      <div id="google-signin-button" style={{ display: 'none' }} />

      {/* Demo Google Sign-In Button */}
      <Button
        block
        shape="round"
        size="large"
        icon={<GoogleOutlined />}
        onClick={handleDemoGoogleSignIn}
        loading={isLoading || isGoogleLoading}
        disabled={isLoading || isGoogleLoading}
      >
        {buttonText} (Demo)
      </Button>

      {/* Instructions for real implementation */}
    </Flex>
  );
}