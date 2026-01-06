'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../api';
import type { LoginCredentials, AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const [error, setError] = useState<string | null>(null);

  // 🔐 LOGIN
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      const response = await authApi.login(credentials);

      if (!response.success) {
        setError(response.error || 'เข้าสู่ระบบไม่สำเร็จ');
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }

      // ✅ cookie ถูก set แล้ว → verify ต่อ
      const verify = await authApi.verify();

      if (verify.valid && verify.account) {
        setState({
          user: verify.account,
          isAuthenticated: true,
          isLoading: false,
        });

        router.push('/admin');
        return true;
      }

      setError('ยืนยันตัวตนไม่สำเร็จ');
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;

    } catch (err) {
      console.error(err);
      setError('Connection Error');
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [router]);

  // 🔍 CHECK AUTH (ใช้กับ layout / guard)
  const checkAuth = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    const res = await authApi.verify();

    if (res.valid && res.account) {
      setState({
        user: res.account,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    }

    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    router.push('/admin/login');
    return false;
  }, [router]);

  // 🚪 LOGOUT
  const logout = useCallback(async () => {
    await authApi.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    router.push('/admin/login');
  }, [router]);

  return {
    ...state,
    error,
    login,
    logout,
    checkAuth,
    clearError: () => setError(null),
  };
}

export default useAuth;
