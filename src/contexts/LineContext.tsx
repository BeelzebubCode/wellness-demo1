// ==========================================
// 📌 Context: LineContext
// ==========================================

'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { LineProfile } from '@/types';

interface LineContextValue {
  profile: LineProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
}

const LineContext = createContext<LineContextValue | undefined>(undefined);

// LIFF SDK types (minimal)
declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: () => void;
      logout: () => void;
      getProfile: () => Promise<LineProfile>;
      ready: Promise<void>;
    };
  }
}

interface LineProviderProps {
  children: ReactNode;
  liffId?: string;
}

export function LineProvider({ children, liffId }: LineProviderProps) {
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize LIFF
  useEffect(() => {
    const initLiff = async () => {
      if (!liffId) {
        setIsLoading(false);
        return;
      }

      try {
        // Load LIFF SDK
        if (!window.liff) {
          const script = document.createElement('script');
          script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
          script.async = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        // Initialize LIFF
        await window.liff!.init({ liffId });
        setIsInitialized(true);

        // Check login status
        if (window.liff!.isLoggedIn()) {
          const userProfile = await window.liff!.getProfile();
          setProfile(userProfile);
        }
      } catch (err) {
        console.error('LIFF initialization error:', err);
        setError('ไม่สามารถเชื่อมต่อ LINE ได้');
      } finally {
        setIsLoading(false);
      }
    };

    initLiff();
  }, [liffId]);

  const login = useCallback(() => {
    if (window.liff && isInitialized) {
      window.liff.login();
    }
  }, [isInitialized]);

  const logout = useCallback(() => {
    if (window.liff && isInitialized) {
      window.liff.logout();
      setProfile(null);
      window.location.reload();
    }
  }, [isInitialized]);

  const isLoggedIn = !!profile;

  return (
    <LineContext.Provider
      value={{
        profile,
        isLoggedIn,
        isLoading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </LineContext.Provider>
  );
}

export function useLine(): LineContextValue {
  const context = useContext(LineContext);

  // ✅ ปิด LINE ชั่วคราว: ถ้าไม่ได้ครอบ Provider ก็ไม่ต้องพัง ให้คืนค่า default ไปเลย
  if (context === undefined) {
    return {
      profile: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,
      login: () => {
        // noop (ปิด LINE ไว้ก่อน)
        console.warn('[Line] LINE is disabled (no provider).');
      },
      logout: () => {
        // noop (ปิด LINE ไว้ก่อน)
        console.warn('[Line] LINE is disabled (no provider).');
      },
    };
  }

  return context;
}

