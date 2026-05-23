# Munchies Marketplace System

Munchies is a hostel-based marketplace where students run food stores from hostel rooms. Customers browse stores, manage carts, and place bookings. Store owners manage inventory and orders. Admins approve store ownership requests.

## Stack

- **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Express.js, TypeScript, Prisma ORM, PostgreSQL
- **Auth:** JWT (Bearer token), bcrypt password hashing

## Roles (RBAC)

| Role | Capabilities |
|------|----------------|
| `USER` | Browse stores, cart, checkout, bookings, request store ownership |
| `STORE_OWNER` | Manage stores/items, view store bookings, confirm/complete orders, review cancellations |
| `ADMIN` | Approve/reject ownership requests, full store/booking access |

The API enforces roles on every protected route. The frontend mirrors roles for navigation and redirects unauthorized users.

## Main routes

| Route | Access |
|-------|--------|
| `/` | Public store directory |
| `/stores/[id]` | Public store + menu |
| `/login`, `/register` | Public |
| `/cart`, `/bookings` | Authenticated |
| `/store-owner-request` | Authenticated (`USER`) |
| `/store-owner/stores`, `/store-owner/inventory` | `STORE_OWNER`, `ADMIN` |
| `/admin/store-owner-requests` | `ADMIN` |

## Environment

**`backend/.env`** (copy from `backend/.env.example`):

```env
NODE_ENV="development"
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/munchies?schema=public"
FRONTEND_ORIGIN="http://localhost:3000"
JWT_SECRET="local-development-jwt-secret-min-32-chars"
JWT_EXPIRES_IN="7d"
```

**`frontend/.env.local`:**

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:5000/api"
```

`JWT_SECRET` must be at least 32 characters or the backend will refuse to start.

## Local setup

```bash
npm install
```

Create PostgreSQL database `munchies`, configure `backend/.env`, then:

```bash
npm run prisma:generate --workspace backend
npm exec --workspace backend prisma migrate deploy
```

Run both apps:

```bash
npm run dev
```

Or use `start.bat` on Windows (migrations + dev servers).

## Verification

```bash
npm run lint
npm run format:check
npm run typecheck --workspace frontend
npm run typecheck --workspace backend
npm run build
```

## First-time usage (empty database)

1. Register a customer account.
2. Register a separate admin account, then promote it in PostgreSQL (use the email you registered with):  
   `UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@munchies.local';`
3. Add at least one hostel in PostgreSQL (required for ownership requests and stores):  
   `INSERT INTO "Hostel" (id, name, "createdAt", "updatedAt") VALUES (gen_random_uuid(), 'North Hostel', NOW(), NOW());`
4. Customer submits a store ownership request.
5. Admin approves the request; user becomes `STORE_OWNER` and can manage stores/inventory.
6. Customers add items to cart and checkout to create bookings.

## API overview

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Hostels:** `GET /api/hostels`
- **Stores:** `GET /api/stores`, `GET /api/stores/:id`, owner CRUD under `/api/stores`
- **Items:** `/api/stores/:storeId/items`
- **Cart:** `/api/carts` (per-user, per-store)
- **Bookings:** `/api/bookings` checkout, status, cancellation workflow
- **Ownership:** `/api/store-ownership-requests`, admin `/api/admin/store-ownership-requests`

## Project structure

```text
munchies/
  frontend/     Next.js app, services, auth context
  backend/      Express API, Prisma, migrations
```
