import {createContext, type ReactNode, useContext, useEffect, useState} from 'react';

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
      await new Promise(resolve => setTimeout(resolve, 1000));

      const payload = JSON.parse(atob(googleCredential.credential.split('.')[1]));

      let existingUser = mockUsers.find(u => u.email === payload.email);

      if (!existingUser) {
        const mockedGoogleUser = {
          id: Date.now().toString(),
          name: payload.name,
          email: payload.email,
          password: '',
          createdAt: new Date().toISOString().split('T')[0]
        };
        mockUsers.push(mockedGoogleUser);
        existingUser = mockedGoogleUser;
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