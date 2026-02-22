import { NextResponse } from "next/server";
import { getPublicDocs } from "@/services/document/handlers/publicDoc";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || undefined;

    const data = await getPublicDocs(slug);
    
    return NextResponse.json({ valid: true, data });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    if (error.message === "Document not found") return NextResponse.json({ valid: false, message: "Document not found" }, { status: 404 });
    return NextResponse.json(
      { valid: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
