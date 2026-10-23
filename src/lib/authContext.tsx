'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole, SystemActivityLog } from '@/lib/types';

// Lightweight demo avatars per role (used as UI fallbacks in dashboards).
export const DEMO_USERS: Record<UserRole, { name: string; avatar: string }> = {
  buyer:   { name: 'Rahul Sharma',        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  owner:   { name: 'Priya Venkatesh',     avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  agent:   { name: 'Vikram Deshmukh',     avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  builder: { name: 'Amit Singhal',        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  admin:   { name: 'BayBayt Master Admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  isLoading: boolean;
  users: UserProfile[];
  activityLogs: SystemActivityLog[];
  loginWithPassword: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string; devCode?: string }>;
  loginWithOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  // Sign-up verification: send a code to a NEW user's phone / email (works for
  // numbers & addresses not yet attached to any account).
  sendSignupPhoneOtp: (phone: string) => Promise<{ success: boolean; error?: string; devCode?: string }>;
  sendSignupEmailOtp: (email: string) => Promise<{ success: boolean; error?: string; devCode?: string }>;
  signup: (userData: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    city?: string;
    state?: string;
    country?: string;
    companyName?: string;
    reraNumber?: string;
    password?: string;
    phoneOtp: string;
    emailOtp: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  toggleBlockUser: (userId: string, reason?: string) => void;
  deleteUser: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  createUser: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    city?: string;
    companyName?: string;
    reraNumber?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateUser: (
    userId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      role: UserRole;
      city: string;
      companyName: string;
      reraNumber: string;
      password: string;
      // Preferred Agent curation (admin-managed).
      isPreferredAgent: boolean;
      agentBadge: string;
      agentRating: number | string;
      agencyLogo: string;
      operatingSince: number | string;
      experienceYears: number | string;
      buyersServed: string;
      agentAbout: string;
      specializations: string[] | string;
      areasServed: string[] | string;
      languages: string[] | string;
    }>
  ) => Promise<{ success: boolean; error?: string }>;
  logActivity: (log: Omit<SystemActivityLog, 'id' | 'timestamp'>) => void;
  clearActivityLogs: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activityLogs, setActivityLogs] = useState<SystemActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // False until the initial session check resolves — lets guards distinguish
  // "still loading" from "definitely not signed in".
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Load current session on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await api('/api/auth/me');
      if (active && data?.user) setUser(data.user);
      if (active) setIsAuthReady(true);
    })();
    return () => { active = false; };
  }, []);

  // Admin-only data: load users + activity logs once an admin is signed in.
  const refreshAdminData = useCallback(async () => {
    const [u, a] = await Promise.all([api('/api/users'), api('/api/activity')]);
    if (u.ok && u.data?.users) setUsers(u.data.users);
    if (a.ok && a.data?.logs) setActivityLogs(a.data.logs);
  }, []);

  useEffect(() => {
    let active = true;
    if (user?.role === 'admin') {
      Promise.all([api('/api/users'), api('/api/activity')]).then(([u, a]) => {
        if (!active) return;
        if (u.ok && u.data?.users) setUsers(u.data.users);
        if (a.ok && a.data?.logs) setActivityLogs(a.data.logs);
      });
    } else {
      queueMicrotask(() => {
        if (active) {
          setUsers([]);
          setActivityLogs([]);
        }
      });
    }
    return () => { active = false; };
  }, [user?.role]);

  const loginWithPassword = async (emailOrPhone: string, password: string) => {
    setIsLoading(true);
    const { ok, data } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password }),
    });
    setIsLoading(false);
    if (ok && data?.success) { setUser(data.user); return { success: true }; }
    return { success: false, error: data?.error || 'Login failed.' };
  };

  const sendOtp = async (phone: string) => {
    const { ok, data } = await api('/api/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    if (ok && data?.success) return { success: true, devCode: data.devCode };
    return { success: false, error: data?.error || 'Could not send the verification code.' };
  };

  const loginWithOtp = async (phone: string, otp: string) => {
    setIsLoading(true);
    const { ok, data } = await api('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
    setIsLoading(false);
    if (ok && data?.success) { setUser(data.user); return { success: true }; }
    return { success: false, error: data?.error || 'Invalid code. Please try again.' };
  };

  // Uses /api/otp/request (not /api/auth/otp/send) so it works for a phone that
  // has no account yet — this is registration, not sign-in.
  const sendSignupPhoneOtp = async (phone: string) => {
    const { ok, data } = await api('/api/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    if (ok && data?.success) return { success: true, devCode: data.devCode };
    return { success: false, error: data?.error || 'Could not send the mobile code.' };
  };

  const sendSignupEmailOtp = async (email: string) => {
    const { ok, data } = await api('/api/auth/email-otp/send', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (ok && data?.success) return { success: true, devCode: data.devCode };
    return { success: false, error: data?.error || 'Could not send the email code.' };
  };

  const signup: AuthContextType['signup'] = async (userData) => {
    setIsLoading(true);
    const { ok, data } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setIsLoading(false);
    if (ok && data?.success) { setUser(data.user); return { success: true }; }
    return { success: false, error: data?.error || 'Registration failed.' };
  };

  const logout = () => {
    // Clear the server session, then hard-navigate home. `keepalive` lets the
    // logout request finish (and apply its Set-Cookie clear) even though we
    // immediately leave the page. A full navigation — rather than router.push —
    // is deliberate: it lands reliably on home and sidesteps the protected-page
    // guards (dashboard/post-*) that bounce a now-null user to /auth, so an
    // explicit sign-out goes home while passive gatekeeping still routes to /auth.
    void api('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    } else {
      setUser(null);
    }
  };

  const updateProfile = (patch: Partial<UserProfile>) => {
    if (!user) return;
    const optimistic = { ...user, ...patch };
    setUser(optimistic); // instant feedback
    api('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(patch) }).then(({ ok, data }) => {
      if (ok && data?.user) setUser(data.user);
    });
  };

  const toggleBlockUser = (userId: string, reason?: string) => {
    const target = users.find((u) => u.id === userId);
    const nextBlocked = !target?.isBlocked;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isBlocked: nextBlocked, blockedReason: nextBlocked ? reason : undefined } : u)));
    api(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked: nextBlocked, blockedReason: reason }),
    }).then(() => refreshAdminData());
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    api(`/api/users/${userId}`, { method: 'DELETE' }).then(() => refreshAdminData());
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    api(`/api/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) }).then(() => refreshAdminData());
  };

  const createUser: AuthContextType['createUser'] = async (data) => {
    const { ok, data: res } = await api('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (ok && res?.success) { await refreshAdminData(); return { success: true }; }
    return { success: false, error: res?.error || 'Failed to create user.' };
  };

  const updateUser: AuthContextType['updateUser'] = async (userId, data) => {
    const { ok, data: res } = await api(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (ok && res?.success) { await refreshAdminData(); return { success: true }; }
    return { success: false, error: res?.error || 'Failed to update user.' };
  };

  // Server records activity automatically on meaningful actions. This provides
  // instant optimistic feedback in the admin feed; a refresh reconciles to truth.
  const logActivity = (log: Omit<SystemActivityLog, 'id' | 'timestamp'>) => {
    setActivityLogs((prev) => [{ ...log, id: `local-${Date.now()}`, timestamp: 'Just now' }, ...prev].slice(0, 50));
  };

  const clearActivityLogs = () => setActivityLogs([]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthReady,
        isLoading,
        users,
        activityLogs,
        loginWithPassword,
        sendOtp,
        loginWithOtp,
        sendSignupPhoneOtp,
        sendSignupEmailOtp,
        signup,
        logout,
        updateProfile,
        toggleBlockUser,
        deleteUser,
        updateUserRole,
        createUser,
        updateUser,
        logActivity,
        clearActivityLogs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
