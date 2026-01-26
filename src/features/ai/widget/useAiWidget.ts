// features/ai/widget/useAiWidget.ts
"use client";
import { create } from "zustand";

export type AiWidgetMode = "help" | "booking_agent";

type AiWidgetState = {
  open: boolean;
  mode: AiWidgetMode;
  openChat: (mode?: AiWidgetMode) => void;
  closeChat: () => void;
  toggle: () => void;
  setMode: (mode: AiWidgetMode) => void;
};

export const useAiWidget = create<AiWidgetState>((set) => ({
  open: false,
  mode: "help",
  openChat: (mode = "help") => set({ open: true, mode }),
  closeChat: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open })),
  setMode: (mode) => set({ mode }),
}));
