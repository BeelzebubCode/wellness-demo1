import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import { createDocument } from "@/services/aiKb/documents/createDocument";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs"; // สำคัญ: ต้องใช้ nodejs เพื่อเขียนไฟล์ได้

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 180);
}

export async function POST(req: NextRequest) {
  try {
    const g = await requireSuperAdmin(req);
    if (!g.ok) {
      return NextResponse.json({ success: false, error: g.error }, { status: g.status });
    }

    const form = await req.formData();

    // fields
    const key = String(form.get("key") || "").trim();
    const title = String(form.get("title") || "").trim();
    const category = (form.get("category") ? String(form.get("category")).trim() : "") || null;
    const urlHint = (form.get("urlHint") ? String(form.get("urlHint")).trim() : "") || null;

    const universityIdRaw = form.get("universityId");
    const universityId =
      universityIdRaw === null || universityIdRaw === undefined || String(universityIdRaw) === "" || String(universityIdRaw) === "null"
        ? null
        : Number(universityIdRaw);

    if (!key || !title) {
      return NextResponse.json({ success: false, error: "กรุณากรอก key และ title" }, { status: 400 });
    }
    if (universityId !== null && !Number.isFinite(universityId)) {
      return NextResponse.json({ success: false, error: "universityId ไม่ถูกต้อง" }, { status: 400 });
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "กรุณาแนบไฟล์ (field: file)" }, { status: 400 });
    }

    const filename = safeName(file.name || "upload");
    const ext = path.extname(filename).toLowerCase();

    // รองรับ .md .markdown .json .txt
    const isMd = ext === ".md" || ext === ".markdown" || ext === ".txt";
    const isJson = ext === ".json";
    if (!isMd && !isJson) {
      return NextResponse.json(
        { success: false, error: "รองรับเฉพาะไฟล์ .md / .markdown / .txt / .json" },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // save file to disk
    const baseDir = path.join(process.cwd(), "uploads", "ai-kb");
    await fs.mkdir(baseDir, { recursive: true });

    const savedName = `${Date.now()}_${filename}`;
    const savedPath = path.join(baseDir, savedName);
    await fs.writeFile(savedPath, bytes);

    // parse content
    let contentType: "MARKDOWN" | "JSON" = isJson ? "JSON" : "MARKDOWN";
    let sourceMd: string | null = null;
    let sourceJson: any | null = null;

    if (contentType === "MARKDOWN") {
      sourceMd = bytes.toString("utf-8");
    } else {
      try {
        sourceJson = JSON.parse(bytes.toString("utf-8"));
      } catch {
        return NextResponse.json({ success: false, error: "ไฟล์ JSON ไม่ถูกต้อง (parse ไม่ได้)" }, { status: 400 });
      }
    }

    // ใช้ urlHint เก็บ path ของไฟล์ก็ได้ (ถ้านายต้องการ)
    const created = await createDocument({
      universityId,
      key,
      title,
      category,
      urlHint: urlHint ?? `/uploads/ai-kb/${savedName}`,
      contentType,
      sourceMd,
      sourceJson,
    });

    return NextResponse.json({ success: true, data: created }, { status: 200 });
  } catch (e: any) {
    console.error("[AI_KB_UPLOAD]", e);
    return NextResponse.json({ success: false, error: e?.message || "Internal Server Error" }, { status: 500 });
  }
}
