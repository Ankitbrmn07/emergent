import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateGroqKey: (key: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : { id: 'default_user', name: 'Alex Developer', email: 'demo@emergent.ai', is_admin: true, groq_api_key: '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' };
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const resp = await apiClient.post('/auth/login', { email, password });
      const { access_token, user: userProfile } = resp.data;
      setToken(access_token);
      setUser(userProfile);
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_profile', JSON.stringify(userProfile));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const resp = await apiClient.post('/auth/register', { name, email, password });
      const { access_token, user: userProfile } = resp.data;
      setToken(access_token);
      setUser(userProfile);
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_profile', JSON.stringify(userProfile));
    } finally {
      setIsLoading(false);
    }
  };

  const updateGroqKey = async (key: string) => {
    if (user) {
      const updatedUser = { ...user, groq_api_key: key };
      setUser(updatedUser);
      localStorage.setItem('user_profile', JSON.stringify(updatedUser));
      await apiClient.put('/auth/profile/groq-key', { groq_api_key: key });
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_profile');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateGroqKey,
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
