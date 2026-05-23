# Munchies

Munchies is a production-oriented hostel marketplace platform where students can run mini food stores inside hostels.

This repository is intentionally built phase by phase. The current state is project setup only: no marketplace features have been implemented yet.

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Express.js, TypeScript, Prisma ORM
- Database: PostgreSQL
- Tooling: ESLint, Prettier

## Structure

```text
munchies/
  frontend/
    app/
    components/
    hooks/
    services/
    lib/
    types/
  backend/
    prisma/
    src/
      controllers/
      routes/
      services/
      middleware/
      prisma/
      utils/
      config/
      validators/
      jobs/
      cache/
      emails/
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create environment files:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Run both apps:

```bash
npm run dev
```

Run one app:

```bash
npm run dev --workspace frontend
npm run dev --workspace backend
```

## Database

Configure `backend/.env` with a PostgreSQL connection string:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/munchies?schema=public"
```

The Prisma datasource is configured in `backend/prisma/schema.prisma`. Prisma Client generation should be run after the first database models are introduced in a later phase:

```bash
npm run prisma:generate --workspace backend
```

## Development Rules

- Implement only the current requested phase.
- Keep controllers thin and move business logic into services.
- Keep validation, middleware, configuration, database access, jobs, cache, and emails modular.
- Use environment variables for runtime configuration.
- Preserve the folder structure as the system grows.
