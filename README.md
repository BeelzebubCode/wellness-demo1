<div align="center">

# 🏥 Wellness Booking

### ระบบจองคิวให้คำปรึกษาด้านสุขภาวะ 

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

**NU Wellness Booking** คือระบบ Full-Stack Web Application สำหรับการจองคิวให้คำปรึกษาด้านสุขภาวะ (Wellness Counseling)
ออกแบบมาเพื่อรองรับการจัดการแบบ Multi-tenant ระดับมหาวิทยาลัย พร้อมระบบ Dashboard วิเคราะห์ข้อมูลระดับกระทรวง

</div>

---

## ✨ Features

### 🎓 ระบบมหาวิทยาลัย (University Tenant)
- **ระบบจองคิว** — นิสิต/นักศึกษาสามารถจองเวลาให้คำปรึกษาด้านสุขภาวะได้
- **ระบบที่ปรึกษา (Advisor)** — อาจารย์ที่ปรึกษาดูแลนิสิตในสังกัด
- **ระบบนักจิตวิทยาประจำศูนย์ (Consultant)** — ให้คำปรึกษาเชิงลึก
- **หัวหน้านักจิตวิทยา (Head Consultant)** — จัดการคิวและมอบหมายงาน
- **หัวหน้าภาควิชา (Head Department)** — ดูสรุปข้อมูลระดับภาควิชา
- **คณบดี (Dean)** — ดูภาพรวมระดับคณะ
- **อธิการบดี (Rector)** — ดูภาพรวมระดับมหาวิทยาลัย

### 🏛️ ระบบกระทรวง (Ministry Platform)
- **Dashboard** — แดชบอร์ดวิเคราะห์ข้อมูลภาพรวมทุกมหาวิทยาลัย
- **AI Insight** — วิเคราะห์ข้อมูลด้วย AI (Ollama / LiteLLM)
- **Heat Map** — แผนที่ความร้อนแสดงความเสี่ยงเชิงพื้นที่
- **จัดการมหาวิทยาลัย** — ดูรายละเอียดและสถิติแต่ละมหาวิทยาลัย

### 🔧 ฟีเจอร์ทั่วไป
- ✅ Multi-tenant Architecture
- ✅ Role-based Access Control (RBAC)
- ✅ JWT Authentication
- ✅ LINE Login / LIFF Integration
- ✅ Interactive Map (Mapbox / Leaflet)
- ✅ Real-time Charts & Analytics (Chart.js, Recharts)
- ✅ AI-powered Analysis (Ollama)
- ✅ Docker Compose สำหรับ Development
- ✅ Responsive Design

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3, Framer Motion |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 5 |
| **Authentication** | JWT (jose), bcryptjs |
| **AI** | Ollama, LiteLLM Proxy |
| **Maps** | Mapbox GL, Leaflet |
| **Charts** | Chart.js, Recharts |
| **Line API** | LINE Bot SDK, LIFF |
| **State Management** | Zustand |
| **Validation** | Zod |
| **Containerization** | Docker Compose |

---

## 📁 Project Structure

```
wellness-demo1/
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma        # Prisma schema
│   ├── migrations/          # Database migrations
│   └── seed.ts              # Seed data
├── src/
│   ├── app/
│   │   ├── (platform)/      # Ministry-level dashboard
│   │   │   ├── ministry/    # Dashboard, AI Insight, Heat Map
│   │   │   └── super-admin/ # Super admin panel
│   │   ├── (tenant)/        # University-level features
│   │   │   ├── (booking)/   # Booking system
│   │   │   ├── (public)/    # Public pages
│   │   │   └── (university)/ # Role-based panels
│   │   │       ├── advisor/
│   │   │       ├── consultant/
│   │   │       ├── dean/
│   │   │       ├── head-consultant/
│   │   │       ├── head-department/
│   │   │       └── rector/
│   │   ├── api/             # API routes
│   │   └── login/           # Login page
│   ├── components/          # Shared UI components
│   ├── config/              # App configuration
│   ├── contexts/            # React contexts
│   ├── features/            # Feature modules
│   ├── lib/                 # Utility libraries
│   ├── services/            # Business logic services
│   ├── shared/              # Shared utilities
│   ├── styles/              # Global styles
│   └── types/               # TypeScript type definitions
├── docker-compose.yml       # Docker services config
├── Dockerfile               # Production build
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **Docker** & **Docker Compose**
- **pnpm** or **npm**

### 1. Clone Repository

```bash
git clone https://github.com/BeelzebubCode/wellness-demo1.git
cd wellness-demo1
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

แก้ไขค่าใน `.env` ให้เหมาะสมกับ environment ของคุณ

### 3. Start Database Services

```bash
docker compose up -d
```

Services ที่จะ start:
- **PostgreSQL 16** — Port `5434`
- **pgAdmin 4** — Port `8080`

### 4. Install Dependencies

```bash
npm install
```

### 5. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed data (optional)
npx prisma db seed
```

### 6. Run Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database |

---

## 👥 ผู้จัดทำ (Contributors)

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/BeelzebubCode">
        <img src="https://github.com/BeelzebubCode.png" width="100px;" alt="Beelzebub"/><br />
        <sub><b>Beelzebub</b></sub>
      </a><br />
      <sub>BeelzebubCode</sub>
    </td>
    <td align="center">
      <a href="https://github.com/cchiOru">
        <img src="https://github.com/cchiOru.png" width="100px;" alt="yodsakorn_jangmanee"/><br />
        <sub><b>yodsakorn_jangmanee</b></sub>
      </a><br />
      <sub>cchiOru</sub>
    </td>
    <td align="center">
      <a href="https://github.com/Cell1991">
        <img src="https://github.com/Cell1991.png" width="100px;" alt="Chu"/><br />
        <sub><b>Chu</b></sub>
      </a><br />
      <sub>Cell1991</sub>
    </td>
    <td align="center">
      <a href="https://github.com/Golffzza">
        <img src="https://github.com/Golffzza.png" width="100px;" alt="Golffzza"/><br />
        <sub><b>Golffzza</b></sub>
      </a><br />
      <sub>Golffzza</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="https://github.com/KrittinWCHAT">
        <img src="https://github.com/KrittinWCHAT.png" width="100px;" alt="Krittin_Thamjaroenkul"/><br />
        <sub><b>Krittin_Thamjaroenkul</b></sub>
      </a><br />
      <sub>KrittinWCHAT</sub>
    </td>
    <td align="center">
      <a href="https://github.com/Nathanjnz3266">
        <img src="https://github.com/Nathanjnz3266.png" width="100px;" alt="Nathan"/><br />
        <sub><b>Nathan</b></sub>
      </a><br />
      <sub>Nathanjnz3266</sub>
    </td>
    <td align="center">
      <a href="https://github.com/Songsaeng1001">
        <img src="https://github.com/Songsaeng1001.png" width="100px;" alt="Songsaeng1001"/><br />
        <sub><b>Songsaeng1001</b></sub>
      </a><br />
      <sub>Songsaeng1001</sub>
    </td>
    <td align="center">
    </td>
  </tr>
</table>

---

## 📄 License

This project is for **educational and academic purposes only**.

---

<div align="center">

Made with ❤️ by **Wellness Team**

</div>
