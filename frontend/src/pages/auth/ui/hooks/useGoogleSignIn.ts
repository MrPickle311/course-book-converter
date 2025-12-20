import {useEffect, useState} from 'react';
import {useAuth} from '@/shared/lib/context/AuthContext.tsx';

export const useGoogleSignIn = () => {
    const { loginWithGoogle, isLoading } = useAuth();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    useEffect(() => {

        const loadGoogleScript = () => {

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        };

        loadGoogleScript();
    }, []);

    const handleDemoGoogleSignIn = async () => {
        setIsGoogleLoading(true);

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

    return  {
        handleDemoGoogleSignIn,
        isLoading,
        isGoogleLoading
    };
}