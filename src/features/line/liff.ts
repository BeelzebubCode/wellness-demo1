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

declare global {
  interface Window {
    liff?: Liff;
  }
}

export const liffHelper = {
  async init(liffId: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    try {
      // Load LIFF SDK if not already loaded
      if (!window.liff) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load LIFF SDK'));
          document.head.appendChild(script);
        });
      }

      await window.liff!.init({ liffId });
      return true;
    } catch (error) {
      console.error('LIFF init error:', error);
      return false;
    }
  },

  isLoggedIn(): boolean {
    return window.liff?.isLoggedIn() ?? false;
  },

  isInClient(): boolean {
    return window.liff?.isInClient() ?? false;
  },

  login(redirectUri?: string): void {
    window.liff?.login({ redirectUri });
  },

  logout(): void {
    window.liff?.logout();
  },

  async getProfile(): Promise<LiffProfile | null> {
    try {
      if (!window.liff?.isLoggedIn()) return null;
      return await window.liff.getProfile();
    } catch {
      return null;
    }
  },

  closeWindow(): void {
    window.liff?.closeWindow();
  },
};

export default liffHelper;