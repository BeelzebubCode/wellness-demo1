export type PRItem = {
  id: string;
  slug: string;            // ใช้ทำ route จริง
  title: string;
  excerpt?: string;
  coverImage?: string;     // /images/... หรือ url
  publishedAt: string;     // ISO string
  href?: string;           // ถ้าเป็นลิงก์ภายนอก
};
