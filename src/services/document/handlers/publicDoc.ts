import prisma from "@/lib/prisma";

export async function getPublicDocs(slug?: string) {
  if (slug) {
    const document = await prisma.guidebookDocument.findUnique({
      where: { document_slug: slug, document_is_active: true }
    });
    if (!document) throw new Error("Document not found");
    return document;
  }

  const documents = await prisma.guidebookDocument.findMany({
    where: { document_is_active: true },
    orderBy: { document_order: 'asc' },
    select: {
      document_slug: true,
      document_title: true,
    }
  });

  return documents;
}
