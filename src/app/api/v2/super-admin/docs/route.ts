import { NextResponse, NextRequest } from "next/server";
import {
  getSuperAdminDocs,
  createSuperAdminDoc,
  updateSuperAdminDoc,
  deleteSuperAdminDoc,
} from "@/services/document/handlers/superAdminDoc";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || undefined;
    const id = searchParams.get('id') || undefined;

    const data = await getSuperAdminDocs(request, id, slug);
    return NextResponse.json({ valid: true, data });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ valid: false, message: "Unauthorized" }, { status: 401 });
    if (error.message === "Not found") return NextResponse.json({ valid: false, message: "Not found" }, { status: 404 });
    return NextResponse.json({ valid: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await createSuperAdminDoc(request, body);
    return NextResponse.json({ valid: true, data });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ valid: false, message: "Unauthorized" }, { status: 401 });
    if (error.message === "Slug already exists") return NextResponse.json({ valid: false, message: "Slug already exists" }, { status: 400 });
    if (error?.name === "ZodError") return NextResponse.json({ valid: false, message: "Validation error", errors: error.errors }, { status: 400 });
    return NextResponse.json({ valid: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await updateSuperAdminDoc(request, body);
    return NextResponse.json({ valid: true, data });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ valid: false, message: "Unauthorized" }, { status: 401 });
    if (error.message === "Slug already exists") return NextResponse.json({ valid: false, message: "Slug already exists" }, { status: 400 });
    if (error?.name === "ZodError") return NextResponse.json({ valid: false, message: "Validation error", errors: error.errors }, { status: 400 });
    return NextResponse.json({ valid: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ valid: false, message: "Document ID required" }, { status: 400 });

    await deleteSuperAdminDoc(request, id);
    return NextResponse.json({ valid: true, message: "Deleted successfully" });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ valid: false, message: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ valid: false, message: "Internal server error" }, { status: 500 });
  }
}
