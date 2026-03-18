// src/features/booking/components/forms/ServiceMode/ServiceModeIcons.tsx
"use client";

import React from "react";
import {
  Phone, MessageSquare, Video, Headphones, Radio, Wifi, Globe,
  Monitor, Smartphone, Tv, Mail, Send, MessagesSquare, Mic,
  PhoneCall, PhoneForwarded, Voicemail, Webcam, Cast, Podcast,
  Megaphone, Rss, Share2, Link, Airplay,
} from "lucide-react";
import { SiLine, SiGooglemeet, SiZoom, SiDiscord, SiSlack, SiWhatsapp, SiTelegram, SiSignal, SiWebex } from "react-icons/si";
import { BsMicrosoftTeams } from "react-icons/bs";

// ═══════════════════════════════════════════════════════════════
// ICON REGISTRY — one central map for all icon keys
// When admin picks an icon from the picker, its key goes into DB.
// The picker + ChannelIcon both read from this registry.
// ═══════════════════════════════════════════════════════════════

export interface IconEntry {
  component: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  group: "brand" | "communication" | "general";
  color: string;       // default brand color
  sizeClass: string;   // tailwind h-/w-
}

export const ICON_REGISTRY: Record<string, IconEntry> = {
  // ── Brand icons ──
  line: { component: SiLine, label: "LINE", group: "brand", color: "#06C755", sizeClass: "h-6 w-6" },
  meet: { component: SiGooglemeet, label: "Google Meet", group: "brand", color: "#00897B", sizeClass: "h-5 w-5" },
  zoom: { component: SiZoom, label: "Zoom", group: "brand", color: "#2D8CFF", sizeClass: "h-9 w-9" },
  teams: { component: BsMicrosoftTeams, label: "Microsoft Teams", group: "brand", color: "#6264A7", sizeClass: "h-5 w-5" },
  discord: { component: SiDiscord, label: "Discord", group: "brand", color: "#5865F2", sizeClass: "h-5 w-5" },
  slack: { component: SiSlack, label: "Slack", group: "brand", color: "#4A154B", sizeClass: "h-5 w-5" },
  skype: { component: Globe, label: "Skype", group: "brand", color: "#00AFF0", sizeClass: "h-5 w-5" },
  whatsapp: { component: SiWhatsapp, label: "WhatsApp", group: "brand", color: "#25D366", sizeClass: "h-5 w-5" },
  telegram: { component: SiTelegram, label: "Telegram", group: "brand", color: "#26A5E4", sizeClass: "h-5 w-5" },
  signal: { component: SiSignal, label: "Signal", group: "brand", color: "#3A76F0", sizeClass: "h-5 w-5" },
  webex: { component: SiWebex, label: "Webex", group: "brand", color: "#00BCEB", sizeClass: "h-5 w-5" },

  // ── Communication icons ──
  phone: { component: Phone, label: "โทรศัพท์", group: "communication", color: "#64748B", sizeClass: "h-5 w-5" },
  phone_call: { component: PhoneCall, label: "โทรออก", group: "communication", color: "#10b981", sizeClass: "h-5 w-5" },
  phone_fwd: { component: PhoneForwarded, label: "โอนสาย", group: "communication", color: "#f59e0b", sizeClass: "h-5 w-5" },
  voicemail: { component: Voicemail, label: "ข้อความเสียง", group: "communication", color: "#8b5cf6", sizeClass: "h-5 w-5" },
  video: { component: Video, label: "วิดีโอ", group: "communication", color: "#ef4444", sizeClass: "h-5 w-5" },
  webcam: { component: Webcam, label: "เว็บแคม", group: "communication", color: "#06b6d4", sizeClass: "h-5 w-5" },
  mic: { component: Mic, label: "ไมโครโฟน", group: "communication", color: "#f43f5e", sizeClass: "h-5 w-5" },
  headphones: { component: Headphones, label: "หูฟัง", group: "communication", color: "#3b82f6", sizeClass: "h-5 w-5" },
  message: { component: MessageSquare, label: "ข้อความ", group: "communication", color: "#94a3b8", sizeClass: "h-5 w-5" },
  messages: { component: MessagesSquare, label: "แชท", group: "communication", color: "#22c55e", sizeClass: "h-5 w-5" },
  mail: { component: Mail, label: "อีเมล", group: "communication", color: "#ea580c", sizeClass: "h-5 w-5" },
  send: { component: Send, label: "ส่ง", group: "communication", color: "#0ea5e9", sizeClass: "h-5 w-5" },

  // ── General icons ──
  monitor: { component: Monitor, label: "จอคอม", group: "general", color: "#334155", sizeClass: "h-5 w-5" },
  smartphone: { component: Smartphone, label: "มือถือ", group: "general", color: "#475569", sizeClass: "h-5 w-5" },
  tv: { component: Tv, label: "ทีวี", group: "general", color: "#1e293b", sizeClass: "h-5 w-5" },
  globe: { component: Globe, label: "เว็บ", group: "general", color: "#2563eb", sizeClass: "h-5 w-5" },
  radio: { component: Radio, label: "วิทยุ", group: "general", color: "#d946ef", sizeClass: "h-5 w-5" },
  wifi: { component: Wifi, label: "WiFi", group: "general", color: "#14b8a6", sizeClass: "h-5 w-5" },
  cast: { component: Cast, label: "แคสต์", group: "general", color: "#6366f1", sizeClass: "h-5 w-5" },
  podcast: { component: Podcast, label: "พอดแคสต์", group: "general", color: "#a855f7", sizeClass: "h-5 w-5" },
  megaphone: { component: Megaphone, label: "ประกาศ", group: "general", color: "#f97316", sizeClass: "h-5 w-5" },
  rss: { component: Rss, label: "RSS", group: "general", color: "#f59e0b", sizeClass: "h-5 w-5" },
  share: { component: Share2, label: "แชร์", group: "general", color: "#64748b", sizeClass: "h-5 w-5" },
  link: { component: Link, label: "ลิงก์", group: "general", color: "#0284c7", sizeClass: "h-5 w-5" },
  airplay: { component: Airplay, label: "Airplay", group: "general", color: "#0f172a", sizeClass: "h-5 w-5" },
};

// ─── Helper: get all icon keys ───────────────────────────────
export const ALL_ICON_KEYS = Object.keys(ICON_REGISTRY);

// ─── The ChannelIcon component (used in booking picker) ──────
export function ChannelIcon({
  iconKey,
  disabled,
  className,
}: {
  iconKey: string;
  disabled?: boolean;
  className?: string;
}) {
  const entry = ICON_REGISTRY[iconKey];
  const Comp = entry?.component ?? MessageSquare;
  const color = disabled ? "#CBD5E1" : (entry?.color ?? "#94a3b8");
  const size = className ?? entry?.sizeClass ?? "h-5 w-5";

  return <Comp className={size} style={{ color }} />;
}
