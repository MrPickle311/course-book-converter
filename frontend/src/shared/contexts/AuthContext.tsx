import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (googleCredential: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database (in a real app, this would be handled by your backend)
const mockUsers: Array<User & { password: string }> = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    createdAt: '2024-01-02'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('pdf_course_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('pdf_course_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const foundUser = mockUsers.find(u => u.email === email && u.password === password);

    if (foundUser) {
      const userWithoutPassword = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        createdAt: foundUser.createdAt
      };

      setUser(userWithoutPassword);
      localStorage.setItem('pdf_course_user', JSON.stringify(userWithoutPassword));
      setIsLoading(false);
      return { success: true };
    } else {
      setIsLoading(false);
      return { success: false, error: 'Invalid email or password' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      setIsLoading(false);
      return { success: false, error: 'An account with this email already exists' };
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      createdAt: new Date().toISOString().split('T')[0]
    };

    mockUsers.push(newUser);

    const userWithoutPassword = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    };

    setUser(userWithoutPassword);
    localStorage.setItem('pdf_course_user', JSON.stringify(userWithoutPassword));
    setIsLoading(false);
    return { success: true };
  };

  const loginWithGoogle = async (googleCredential: any): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real implementation, you would:
      // 1. Send the googleCredential.credential (JWT token) to your backend
      // 2. Verify the token with Google's servers
      // 3. Extract user information from the verified token
      // 4. Create or update user in your database

      // For demo purposes, we'll decode the JWT token (don't do this in production!)
      // In production, always verify tokens on your backend
      const payload = JSON.parse(atob(googleCredential.credential.split('.')[1]));

      // Check if user already exists
      let existingUser = mockUsers.find(u => u.email === payload.email);

      if (!existingUser) {
        // Create new user from Google data
        const newUser = {
          id: Date.now().toString(),
          name: payload.name,
          email: payload.email,
          password: '', // No password for Google users
          createdAt: new Date().toISOString().split('T')[0]
        };
        mockUsers.push(newUser);
        existingUser = newUser;
      }

      const userWithoutPassword = {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        createdAt: existingUser.createdAt
      };

      setUser(userWithoutPassword);
      localStorage.setItem('pdf_course_user', JSON.stringify(userWithoutPassword));
      setIsLoading(false);
      return { success: true };

    } catch (error) {
      console.error('Google sign-in error:', error);
      setIsLoading(false);
      return { success: false, error: 'Google sign-in failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pdf_course_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}