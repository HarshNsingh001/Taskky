import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../lib/api';

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  organization_id: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Organization = {
  id: string;
  name: string;
  invite_code: string;
};

type AuthContextType = {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string, role: string, inviteCode: string) => Promise<Organization | null>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  organization: null,
  loading: true,
  login: async () => {},
  signup: async () => null,
  logout: () => {},
  updateUser: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [organization, setOrganization] = useState<Organization | null>(() => {
    try {
      const saved = localStorage.getItem('organization');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('access_token'));

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
      setUser(null);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem('access_token', res.data.tokens.access_token);
      localStorage.setItem('refresh_token', res.data.tokens.refresh_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const signup = async (fullName: string, email: string, password: string, role: string, inviteCode: string): Promise<Organization | null> => {
    const res = await authApi.signup({ full_name: fullName, email, password, role, invite_code: inviteCode });
    if (res.success && res.data) {
      localStorage.setItem('access_token', res.data.tokens.access_token);
      localStorage.setItem('refresh_token', res.data.tokens.refresh_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      
      // Save organization info if returned (admin signup)
      if (res.data.organization) {
        localStorage.setItem('organization', JSON.stringify(res.data.organization));
        setOrganization(res.data.organization);
        return res.data.organization;
      }
      return null;
    } else {
      throw new Error(res.message || 'Signup failed');
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    setUser(null);
    setOrganization(null);
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, organization, loading, login, signup, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
