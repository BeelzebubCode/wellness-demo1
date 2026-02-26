import { NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createDocumentSchema = z.object({
  document_slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  document_title: z.string().min(1, "Title is required"),
  document_content: z.string().min(1, "Content is required"),
  document_is_active: z.boolean().default(true),
  document_order: z.number().int().default(0),
});

export async function getSuperAdminDocs(request: NextRequest, id?: string, slug?: string) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) throw new Error("Unauthorized");

  if (id) {
    const document = await prisma.guidebookDocument.findUnique({
      where: { document_id: parseInt(id) }
    });
    if (!document) throw new Error("Not found");
    return document;
  }

  if (slug) {
    const document = await prisma.guidebookDocument.findUnique({
      where: { document_slug: slug }
    });
    if (!document) throw new Error("Not found");
    return document;
  }

  const documents = await prisma.guidebookDocument.findMany({
    orderBy: { document_order: 'asc' },
  });
  return documents;
}

export async function createSuperAdminDoc(request: NextRequest, data: Record<string, unknown>) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) throw new Error("Unauthorized");

  const validatedData = createDocumentSchema.parse(data);

  const existingSlug = await prisma.guidebookDocument.findUnique({
    where: { document_slug: validatedData.document_slug }
  });

  if (existingSlug) throw new Error("Slug already exists");

  return prisma.guidebookDocument.create({ data: validatedData });
}

export async function updateSuperAdminDoc(request: NextRequest, data: Record<string, unknown>) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) throw new Error("Unauthorized");

  const updateSchema = createDocumentSchema.extend({
    document_id: z.number()
  });

  const { document_id, ...validatedData } = updateSchema.parse(data);

  const existingSlug = await prisma.guidebookDocument.findFirst({
    where: {
      document_slug: validatedData.document_slug,
      document_id: { not: document_id }
    }
  });

  if (existingSlug) throw new Error("Slug already exists");

  return prisma.guidebookDocument.update({
    where: { document_id },
    data: validatedData,
  });
}

export async function deleteSuperAdminDoc(request: NextRequest, id: string) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) throw new Error("Unauthorized");
  if (!id) throw new Error("Document ID required");

  await prisma.guidebookDocument.delete({
    where: { document_id: parseInt(id) }
  });
  return true;
}
