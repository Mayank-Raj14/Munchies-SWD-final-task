# Munchies

Munchies is a hostel marketplace for student-run food stores. Students can browse approved stores, add items to per-store carts, place bookings, and request cancellations. Store owners manage stores, inventory, and order status. Admins review ownership requests and govern marketplace access.

## Tech Stack

- Frontend: Next.js 15 App Router, React, TypeScript, Tailwind CSS
- Backend: Express, TypeScript, Prisma ORM
- Database: PostgreSQL
- Auth: JWT bearer tokens, bcrypt password hashing
- Tooling: npm workspaces, Prisma migrations, Prettier

## Features

- JWT authentication with role-based routing and API authorization
- Roles: `USER`, `STORE_OWNER`, `ADMIN`
- Store ownership request and approval flow
- Store and inventory management with image uploads
- Public marketplace and store detail pages
- Per-store cart grouping
- Checkout to bookings with stock-safe inventory updates
- Item-targeted coupon support in booking and cart flows
- Order status management and cancellation review
- Admin approval and governance flows
- Email notifications and preference categories (bookings, promotions, new stores)
- Store-owner and user analytics dashboards
- Cache layer for high-read endpoints with invalidation hooks
- Background automation for order expiry and campaign activation/deactivation
- Prisma-backed persistence with migration history

## SWD Round 3 Coverage

- Phase 1:
- Authentication and RBAC for `USER`, `STORE_OWNER`, `ADMIN`
- Store ownership request + admin approval/rejection
- Public home/store listing and cart-first booking flow
- Inventory CRUD with image upload and stock tracking
- Phase 2:
- Cancellation request and store-owner review workflow
- Nodemailer notifications for cancellation/governance events
- 24-hour uncollected order expiry handling with warning assignment
- Auto-block on reaching 3 warnings
- Admin global/store-specific block and unblock controls
- Phase 3:
- Coupon campaign system with unique code, discount type, schedule window, min order, global/per-user usage limits
- Coupon application at checkout with item-targeted campaign support
- User-managed email subscription preferences: booking, promotion, new-store categories
- Phase 4:
- Store-owner analytics: revenue metrics, booking stats, stock visibility, item performance
- User analytics: spending, booking count, favorite store/item, monthly spending breakdown
- Cache integration on high-read data paths with explicit invalidation after mutating operations
- Background jobs/utilities for campaign schedule activation/deactivation and order expiry governance

## Project Structure

```text
munchies/
  backend/              Express API, Prisma schema, migrations, services
  frontend/             Next.js app, UI components, API services, auth context
  scripts/              Workspace development helpers
  shorcut script/       Windows batch shortcuts
```

## Environment

Create `backend/.env` from `backend/env.example`:

```env
NODE_ENV="development"
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/munchies?schema=public"
FRONTEND_ORIGIN="http://localhost:3000"
JWT_SECRET="local-development-jwt-secret-min-32-chars"
JWT_EXPIRES_IN="7d"
EMAIL_USER="your_gmail_address@gmail.com"
EMAIL_PASS="your_gmail_app_password"
EMAIL_FROM="Munchies <your_gmail_address@gmail.com>"
ADMIN_EMAIL="mayankraj300u@gmail.com"
```

Optional frontend override in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:5000/api"
```

`JWT_SECRET` must be at least 32 characters.

## Local Development

Install dependencies:

```bash
npm install
```

Start infrastructure:

```bash
docker compose up -d
```

Prepare Prisma:

```bash
npm run prisma:generate --workspace backend
npm run prisma:migrate:deploy --workspace backend
```

If Prisma client generation fails with a Windows file-lock error, stop local Node dev processes and retry:

```bash
taskkill /F /IM node.exe
npm run prisma:generate --workspace backend
```

Start backend:

```bash
npm run dev --workspace backend
```

Start frontend (new terminal):

```bash
npm run dev --workspace frontend
```

The default URLs are:

- Frontend: `http://localhost:3000`
- API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`
- Prisma Studio: `http://localhost:5555`

Windows shortcuts are available in `shorcut script/`:

- `start.bat` installs dependencies if needed, generates Prisma Client, applies migrations, starts both dev servers, and opens the frontend.
- `open prisma.bat` generates Prisma Client and opens Prisma Studio.
- `task kill stuff.bat` frees the frontend, backend, and Prisma Studio ports.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run format
npm run format:check
npm run typecheck --workspace frontend
npm run typecheck --workspace backend
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend
npm run prisma:migrate:deploy --workspace backend
npm run prisma:studio --workspace backend
npm run verify:coupon --workspace backend
npm run verify:analytics --workspace backend
```

## Verification Utilities

- Coupon concurrency verifier: validates concurrent coupon redemption behavior.
- Analytics edge-case verifier: checks analytics aggregation behavior on sparse/edge datasets.

Run from workspace root:

```bash
npm run verify:coupon --workspace backend
npm run verify:analytics --workspace backend
```

Run directly from `backend/`:

```bash
npm run verify:coupon
npm run verify:analytics
```

## Prisma Workflow

Use migrations for schema changes:

```bash
npm run prisma:migrate --workspace backend
npm run prisma:generate --workspace backend
```

For an existing database in local development or deployment:

```bash
npm run prisma:migrate:deploy --workspace backend
```

Open Prisma Studio:

```bash
npm run prisma:studio --workspace backend
```

## First Run Data

After the database is migrated:

1. Register a normal user from the app.
2. Register/login with `mayankraj300u@gmail.com` (configured in `ADMIN_EMAIL`) to access admin features. The backend auto-promotes this account to `ADMIN`.
3. The 12 default hostels are auto-seeded on backend startup.
4. Submit a store ownership request as a user.
5. Approve it as an admin.
6. Add inventory as the store owner and place orders as a customer.

No manual SQL/database edits are required for first run.

## API Overview

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Hostels: `GET /api/hostels`
- Stores: `GET /api/stores`, `GET /api/stores/:id`, owner CRUD under `/api/stores`
- Items: `/api/stores/:storeId/items`
- Carts: `/api/carts`
- Bookings: `/api/bookings`
- Ownership: `/api/store-ownership-requests`, `/api/admin/store-ownership-requests`
- Governance: admin and store-owner moderation routes

## Verification

```bash
npm run typecheck --workspace frontend
npm run typecheck --workspace backend
npm run build
```

Run `npm run format:check` before opening a PR if you need a formatting gate.
