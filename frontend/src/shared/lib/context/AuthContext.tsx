import {createContext, type ReactNode, useContext, useEffect, useState} from 'react';
import type {User} from "@/shared/lib/types/user.ts";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (googleCredential: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  useEffect(function tryLoadUserFromLocalStorage()  {
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

  function fakeCall(resolve: (value: (PromiseLike<unknown> | unknown)) => void) {
    return setTimeout(resolve, 1000);
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    await new Promise(resolve => fakeCall(resolve));

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

    await new Promise(resolve => fakeCall(resolve));

    const foundUserWithGivenEmail = mockUsers.find(u => u.email === email);
    if (foundUserWithGivenEmail) {
      setIsLoading(false);
      return { success: false, error: 'An account with this email already exists' };
    }

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
      await new Promise(resolve => fakeCall(resolve));

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