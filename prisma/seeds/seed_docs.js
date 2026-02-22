const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding documents...');

    const documents = [
        {
            document_slug: 'cancellation-policy',
            document_title: 'เงื่อนไขการระงับสิทธิ์',
            document_content: '<p>เนื้อหาเงื่อนไขการระงับสิทธิ์...</p>',
            document_is_active: true,
            document_order: 1,
        },
        {
            document_slug: 'booking-guide',
            document_title: 'คู่มือการจองคิว',
            document_content: '<p>เนื้อหาคู่มือการจองคิว...</p>',
            document_is_active: true,
            document_order: 2,
        },
        {
            document_slug: 'general',
            document_title: 'ข้อตกลงการใช้บริการ',
            document_content: '<p>เนื้อหาข้อตกลงการใช้บริการ...</p>',
            document_is_active: true,
            document_order: 3,
        }
    ];

    for (const doc of documents) {
        await prisma.document.upsert({
            where: { document_slug: doc.document_slug },
            update: doc,
            create: doc,
        });
    }

    console.log('Documents seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
