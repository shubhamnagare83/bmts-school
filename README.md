# School ERP — Mother Teresa Foundation School

A full-stack ERP management system for schools, built with **Express + Prisma** (backend) and **React + Vite** (frontend).

## Features

- **Multi-role access**: Admin, Faculty, Student
- **Academic management**: Academic years, classes, divisions, subjects
- **Student management**: Enrollment, attendance, marks, report cards
- **Faculty tools**: Homework, timetables, marks entry, attendance
- **Administration**: Notices, analytics, audit logs, certificates
- **PDF report cards** with QR code verification

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS, React Query, Zustand |
| Backend | Express 4, TypeScript, Prisma ORM |
| Database | MySQL 8 / MariaDB 10.4+ (via Prisma) |
| PDF rendering | Puppeteer + Chromium |
| Containerization | Docker, Docker Compose |
| Reverse Proxy | Nginx |

## Prerequisites

- **Node.js** ≥ 18 (20 LTS recommended — the Docker images use 20)
- **Docker** & **Docker Compose** (for containerised deployment)

- **MySQL** 8.0 (or MariaDB 10.4+) — XAMPP works fine for local development

Create the database once before running migrations:

```sql
CREATE DATABASE school_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then set `DATABASE_URL` in `backend/.env` (see `backend/.env.example`).

---

## Quick Start (Development)

```bash
# 1. Clone the repository
git clone <repo-url> && cd school-erp

# 2. Install dependencies, run migrations, and seed
npm run setup

# 3. Start dev servers (backend + frontend concurrently)
npm run dev
```

`npm run setup` applies the migrations in `backend/prisma/migrations` and seeds
the database.

### PDF generation (Chromium)

Server-side PDF report cards are rendered with Puppeteer, which needs a Chromium
binary. `npm run setup` installs it. If PDF downloads fail with
*"PDF generation requires Chromium"*, install it explicitly:

```bash
npm run setup:chromium
# or, from the backend directory:
npx puppeteer browsers install chrome
```

To use a Chromium/Chrome you already have, set `PUPPETEER_EXECUTABLE_PATH` to its
path instead. The Docker image installs Alpine's `chromium` package and sets this
variable for you.

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

---

## Production Deployment (Docker Compose)

### 1. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and set strong secrets (compose refuses to start without them):
# - JWT_SECRET          (generate with: openssl rand -hex 32)
# - JWT_REFRESH_SECRET  (generate with: openssl rand -hex 32)
# - REPORT_CARD_SECRET  (generate with: openssl rand -hex 32)
# - SMTP credentials (only if outbound email is needed)
```

### 2. Build and Start

```bash
# Build all containers
npm run docker:build

# Start all services
npm run docker:up

# View logs
npm run docker:logs
```

The app will be available at **http://localhost** (override with `HTTP_PORT`).

Database migrations run automatically on container start
(`prisma migrate deploy`). Only the backend is reachable through Nginx — it does
not publish port 3000 to the host.

### 3. Seed the Database (first time only)

```bash
docker exec school_erp_backend npx prisma db seed
```

### 4. Stop

```bash
npm run docker:down
```

---

## Default Credentials

Log in with **either** the email address or the username.

| Role | Email | Username | Password |
|------|-------|----------|----------|
| Admin | `admin@mtfschool.edu` | `admin` | `Admin@123` |
| Faculty | `teacher.10th@mtfschool.edu` | `teacher_10th` | `Faculty@123` |
| Student | `adm111@student.mtfschool.edu` | `adm111` | `Student@123` |

Faculty accounts exist per class: `teacher.jrkg@`, `teacher.srkg@`, `teacher.1st@`
… `teacher.10th@mtfschool.edu`.
Students are `adm001` … `adm120`; the username is the admission number.

> ⚠️ **Change these immediately in production!**

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma connection string | `file:/app/data/prod.db` (compose) |
| `JWT_SECRET` | JWT signing secret (required in prod) | — |
| `JWT_REFRESH_SECRET` | Refresh token secret (required in prod) | — |
| `REPORT_CARD_SECRET` | Report card QR signing secret | — |
| `JWT_EXPIRY` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `PORT` | Backend server port | `3000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `FRONTEND_URL` | Frontend origin allowed by CORS | `http://localhost:5173` |
| `HTTP_PORT` | Host port Nginx publishes on | `80` |
| `UPLOAD_DIR` | Directory for uploaded files | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `5242880` |
| `PUPPETEER_EXECUTABLE_PATH` | Chromium binary for PDF rendering | set by the image |

See [`.env.example`](.env.example) for the full list.

---

## Deploying to Hostinger

A ready-to-upload bundle is generated in [`deploy_ready/`](deploy_ready/) with
step-by-step instructions in
[`deploy_ready/README_DEPLOY.md`](deploy_ready/README_DEPLOY.md).

Regenerate the bundle after any code change:

```bash
npm run deploy:build
```

Two hosting paths are covered:

- **Hostinger VPS** (recommended) — Node.js + MySQL + Nginx, or `docker compose up -d`.
  Puppeteer needs a real Chromium, which only a VPS reliably provides.
- **Hostinger Web/Business hosting** — the React frontend runs fine from
  `public_html`, and the Node.js app runner hosts the API. Note that server-side
  PDF download depends on Chromium being available; browser-side **Print** works
  regardless.

---

## Project Structure

```
school-erp/
├── backend/
│   ├── src/
│   │   ├── config/        # Database, JWT configuration
│   │   ├── middleware/    # Auth, error handling, validation
│   │   ├── routes/        # All API route handlers
│   │   ├── utils/         # Helper functions
│   │   └── server.ts      # Express app entry point
│   ├── prisma/
│   │   ├── migrations/    # Versioned schema migrations
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed data
│   ├── assets/            # Images embedded into generated PDFs
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/           # API client & service modules
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (admin/faculty/student)
│   │   ├── stores/        # Zustand state stores
│   │   └── App.tsx        # Root app with routing
│   ├── nginx.conf         # Production Nginx config
│   └── Dockerfile
├── docker-compose.yml     # Full stack deployment
├── .env.example           # Environment template
└── README.md
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend

# Database
npm run db:migrate       # Run migrations (dev)
npm run db:migrate:prod  # Run migrations (production)
npm run db:seed          # Seed database
npm run db:reset         # Reset database
npm run db:studio        # Open Prisma Studio

# Docker
npm run docker:build     # Build all containers
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:logs      # View logs

# Build & verify
npm run build            # Build both frontend & backend
npm run typecheck        # Type-check both without emitting
```

---

## License

Private — All rights reserved.
