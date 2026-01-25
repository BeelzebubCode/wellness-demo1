// features/ai/widget/useAiWidget.ts

"use client";
import { create } from "zustand";

type AiWidgetState = {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggle: () => void;
};

export const useAiWidget = create<AiWidgetState>((set) => ({
  open: false,
  openChat: () => set({ open: true }),
  closeChat: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
