<div align="center">

# 🏥 Wellness Booking

### Wellness Counseling Appointment System

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

A **Full-Stack Web Application** for wellness counseling appointment management.
Designed with a **multi-tenant architecture** at the university level, with a centralized **ministry-level analytics dashboard**.

</div>

---

## ✨ Features

### 🎓 University Tenant System
- **Booking System** — Students can book wellness counseling appointments
- **Advisor Panel** — Academic advisors can monitor and support their students
- **Consultant Panel** — Professional counselors provide in-depth consultations
- **Head Consultant** — Manages queues, assignments, and consultant teams
- **Head of Department** — Views department-level summaries and reports
- **Dean** — Accesses faculty-level analytics overview
- **Rector** — University-wide dashboard and oversight

### 🏛️ Ministry Platform
- **Dashboard** — Centralized analytics across all universities
- **AI Insight** — AI-powered data analysis (Ollama / LiteLLM)
- **Heat Map** — Geographic risk visualization
- **University Management** — Detailed statistics per university

### 🔧 Core Features
- ✅ Multi-tenant Architecture
- ✅ Role-based Access Control (RBAC)
- ✅ JWT Authentication
- ✅ Interactive Maps (Mapbox / Leaflet)
- ✅ Real-time Charts & Analytics (Chart.js, Recharts)
- ✅ AI-powered Analysis (Ollama)
- ✅ Consultant Borrowing System (cross-university)
- ✅ Student Point & Discipline System
- ✅ Docker Compose for Development
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
| **State Management** | Zustand |
| **Validation** | Zod |
| **Containerization** | Docker Compose |

---

## 📁 Project Structure

```
wellness-demo1/
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma        # Prisma schema (60+ models)
│   ├── migrations/          # Database migrations
│   ├── README.md            # 📊 Full ERD documentation
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

## 🗄️ Database Schema (ERD)

The database consists of **60+ models** organized into the following domains:

| Domain | Key Tables | Description |
|---|---|---|
| **Geography** | `Region`, `Province`, `Country` | Geographic reference data |
| **University** | `University`, `Faculty`, `Department` | Organizational hierarchy |
| **Accounts** | `Account`, `AccountRoleCategory`, `AccountUniversityPermission` | Authentication & RBAC |
| **Students** | `Student`, `StudentProfile`, `StudentAcademic`, `StudentAddress` | Student information |
| **Consultants** | `Consultant`, `ConsultantProfile`, `ConsultantShiftTeam` | Counselor management |
| **Bookings** | `Booking`, `BookingAssignment`, `BookingSession`, `BookingOutcome` | Core booking workflow |
| **Feedback** | `Feedback`, `FeedbackRating`, `FeedbackComment` | Service evaluation |
| **Discipline** | `DisciplineLog`, `StudentBehaviorStatus`, `StudentPointWallet` | Point & behavior system |
| **Borrowing** | `BorrowRequest`, `BorrowAssignment`, `ConsultantBorrowAvailability` | Cross-university consultant lending |
| **AI / KB** | `AiKbDocument`, `AiKbChunk`, `AiFeedbackEvent` | AI knowledge base |
| **Academic** | `AcademicTerm`, `AcademicPeriod`, `Season` | Academic calendar |

> 📊 **[View the full ERD diagram →](./prisma/README.md)**

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **Docker** & **Docker Compose**
- **npm** or **pnpm**

### 1. Clone Repository

```bash
git clone https://github.com/BeelzebubCode/wellness-demo1.git
cd wellness-demo1
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file to match your environment configuration.

### 3. Start Database Services

```bash
docker compose up -d
```

This will start:
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

Open [http://localhost:3000](http://localhost:3000) in your browser.

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

## 👥 Contributors

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
     <td align="center">
      <a href="https://github.com/meedet">
        <img src="https://github.com/meedet.png" width="100px;" alt="Golffzza"/><br />
        <sub><b>meedet</b></sub>
      </a><br />
      <sub>meedet</sub>
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
      <a href="https://github.com/momiji007">
        <img src="https://github.com/momiji007.png" width="100px;" alt="momiji007"/><br />
        <sub><b>momiji007</b></sub>
      </a><br />
      <sub>momiji007</sub>
    </td>
    <td align="center">
      <a href="https://github.com/panitsupa790">
        <img src="https://github.com/panitsupa790.png" width="100px;" alt="panitsupa790"/><br />
        <sub><b>panitsupa790</b></sub>
      </a><br />
      <sub>panitsupa790</sub>
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
