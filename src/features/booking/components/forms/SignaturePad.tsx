"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export function SignaturePad({
  value,
  onChange,
  disabled,
  className,
  warning,
}: {
  value?: string | null;
  onChange?: (dataUrl: string | null) => void;
  disabled?: boolean;
  className?: string;
  warning?: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(!!value);

  // 🔥 ตั้งค่า canvas ให้ตรงกับขนาดจริงแบบไม่ใช้ scale()
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";

    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = value;
    }
  }, [value]);

  const getPos = (e: PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    };
  };

  const commit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = hasInk ? canvas.toDataURL("image/png") : null;
    onChange?.(dataUrl);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onDown = (e: PointerEvent) => {
      drawingRef.current = true;
      lastRef.current = getPos(e);
      setHasInk(true);
      canvas.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current) return;

      const p = getPos(e);
      const last = lastRef.current;
      if (!last) {
        lastRef.current = p;
        return;
      }

      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      lastRef.current = p;
    };

    const onUp = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      lastRef.current = null;
      commit();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [disabled, hasInk]);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange?.(null);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="h-7 flex items-center justify-between mb-2 shrink-0">
        <label className="text-sm font-black text-slate-800">
          ลายเซ็นยินยอม (Online) <span className="text-red-500">*</span>
        </label>

        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50"
        >
          ล้างลายเซ็น
        </button>
      </div>

      <div className="h-[220px] rounded-xl border border-gray-200 bg-white overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className={cn("w-full h-full touch-none", disabled && "opacity-60")}
          style={{ touchAction: "none" }}
        />
      </div>

      {warning && <div className="mt-3">{warning}</div>}

      <p className="mt-2 text-[11px] text-gray-400">
        กรุณาเซ็นเพื่อยืนยันความยินยอมในการรับบริการแบบออนไลน์
      </p>
    </div>
  );
}
