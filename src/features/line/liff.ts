// src/features/line/liff.ts

import type { LiffProfile } from './types';

// LIFF SDK type (simplified)
interface Liff {
  init: (config: { liffId: string }) => Promise<void>;
  isLoggedIn: () => boolean;
  isInClient: () => boolean;
  login: (options?: { redirectUri?: string }) => void;
  logout: () => void;
  getProfile: () => Promise<LiffProfile>;
  closeWindow: () => void;
}

function getLiff(): Liff | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as any).liff as Liff | undefined;
}

export const liffHelper = {
  async init(liffId: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      // Load LIFF SDK if not already loaded
      if (!getLiff()) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load LIFF SDK'));
          document.head.appendChild(script);
        });
      }

      const liff = getLiff();
      if (!liff) throw new Error('LIFF SDK not available after loading script');

      await liff.init({ liffId });
      return true;
    } catch (error) {
      console.error('LIFF init error:', error);
      return false;
    }
  },

  isLoggedIn(): boolean {
    return getLiff()?.isLoggedIn() ?? false;
  },

  isInClient(): boolean {
    return getLiff()?.isInClient() ?? false;
  },

  login(redirectUri?: string): void {
    getLiff()?.login({ redirectUri });
  },

  logout(): void {
    getLiff()?.logout();
  },

  async getProfile(): Promise<LiffProfile | null> {
    try {
      const liff = getLiff();
      if (!liff?.isLoggedIn()) return null;
      return await liff.getProfile();
    } catch {
      return null;
    }
  },

  closeWindow(): void {
    getLiff()?.closeWindow();
  },
};

export default liffHelper;
