"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export function StudentPointsBadge({ role }: { role?: string | null }) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const isStudent = useMemo(() => {
    return String(role ?? "").toUpperCase().includes("STUDENT");
  }, [role]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v2/me/points", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "load failed");
      setBalance(Number(json.balance ?? 0));
    } catch {
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStudent) return;

    load();

    const onPointsChanged = () => load();
    window.addEventListener("points-changed", onPointsChanged);
    return () => window.removeEventListener("points-changed", onPointsChanged);
  }, [isStudent]);

  if (!isStudent) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2",
        "h-8 px-3 rounded-full",
        "text-xs font-semibold",
        "border border-[rgb(var(--border)/0.70)]",
        "bg-white/45 hover:bg-white/70",
        "text-[rgb(var(--fg))]",
        "shadow-sm transition",
        "select-none"
      )}
      title="แต้มสะสม"
    >
      <Sparkles
        className={cn("w-4 h-4", loading && "animate-pulse")}
        style={{ color: "rgb(var(--primary))" }}
      />

      <span className="opacity-80">แต้ม</span>

      <span
        className="font-extrabold tabular-nums"
        style={{ color: "rgb(var(--primary))" }}
      >
        {loading ? "..." : balance}
      </span>
    </div>
  );
}
