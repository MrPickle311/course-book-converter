import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

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
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (window.google) {
        setGoogleScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGoogleScriptLoaded(true);
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
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Create a mock JWT token for demo purposes
  const createMockJWT = () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: '1234567890',
      name: 'Demo Google User',
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
    <div className="space-y-3">
      {/* Real Google Sign-In Button (hidden in demo) */}
      <div id="google-signin-button" className="hidden" />
      
      {/* Demo Google Sign-In Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleDemoGoogleSignIn}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {buttonText} (Demo)
          </>
        )}
      </Button>

      {/* Instructions for real implementation */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p><strong>For real Google OAuth:</strong></p>
        <p>1. Get Google Client ID from Google Cloud Console</p>
        <p>2. Replace YOUR_GOOGLE_CLIENT_ID_HERE in GoogleSignIn.tsx</p>
        <p>3. Add your domain to authorized origins</p>
      </div>
    </div>
  );
}