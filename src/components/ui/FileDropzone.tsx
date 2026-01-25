// components/ui/FileDropzone.tsx

"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { UploadCloud, FileText, X, FileJson } from "lucide-react";

interface FileDropzoneProps {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  helperText?: string;
}

export function FileDropzone({
  value,
  onChange,
  accept = ".md,.markdown,.json,.txt",
  maxSizeMb = 10,
  label,
  helperText = "รองรับ .md, .json, .txt",
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndSet(droppedFile);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSet(selectedFile);
  }

  function validateAndSet(file: File) {
    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`ไฟล์ใหญ่เกิน ${maxSizeMb}MB`);
      return;
    }
    onChange(file);
  }

  // State: มีไฟล์แล้ว
  if (value) {
    const isJson = value.name.endsWith(".json");
    return (
      <div className="relative flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
          {isJson ? <FileJson className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-slate-900">{value.name}</p>
          <p className="text-xs text-slate-500">{(value.size / 1024).toFixed(1)} KB</p>
        </div>
        <button
          onClick={() => onChange(null)}
          className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-rose-500 hover:shadow-sm transition-all"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // State: ยังไม่มีไฟล์ (Dropzone)
  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-semibold text-slate-900">{label}</div>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 text-center transition-all duration-200",
          isDragOver
            ? "border-indigo-500 bg-indigo-50/50"
            : "border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={accept}
        />
        <div className={cn(
          "mb-3 rounded-full p-3 shadow-sm ring-1 transition-all duration-200",
          isDragOver ? "bg-indigo-100 ring-indigo-200" : "bg-white ring-slate-100 group-hover:scale-110"
        )}>
          <UploadCloud className={cn("h-6 w-6", isDragOver ? "text-indigo-600" : "text-indigo-500")} />
        </div>
        <p className="text-sm font-medium text-slate-700">
          คลิกเพื่อเลือกไฟล์ <span className="text-slate-400 font-normal">หรือลากไฟล์มาวาง</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">{helperText}</p>
      </div>
    </div>
  );
}