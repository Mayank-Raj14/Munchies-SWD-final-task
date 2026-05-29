# Munchies

Munchies is a full-stack hostel marketplace platform built for student-run food stores inside a campus ecosystem. Students can browse stores, order food, apply coupons, manage bookings, and track analytics, while store owners manage inventory, campaigns, and order workflows. Admins govern the platform through moderation and approval systems.

---

## Features

### Authentication & RBAC

* JWT authentication
* Role-based access control
* Roles:

  * `USER`
  * `STORE_OWNER`
  * `ADMIN`
* Protected routes and APIs
* Persistent login sessions

---

### Store System

* Store ownership request workflow
* Admin approval/rejection system
* Multiple stores per owner support
* Store activation and governance controls
* Store analytics dashboard

---

### Marketplace & Ordering

* Public marketplace browsing
* Store detail pages
* Inventory management
* Per-store cart grouping
* Checkout workflow
* Booking creation and tracking
* Order status management
* Booking cancellation requests

---

### Coupon & Campaign System

* Percentage and flat discounts
* Item-targeted campaigns
* Campaign schedule activation/deactivation
* Global usage limits
* Per-user usage limits
* Minimum order support

---

### Analytics

#### User Analytics

* Total spending
* Booking count
* Favorite store
* Favorite item
* Monthly spending breakdown

#### Store Owner Analytics

* Revenue metrics
* Booking statistics
* Low stock alerts
* Best/least selling items

---

### Email Notifications

* Booking notifications
* Promotion notifications
* Governance notifications
* Email preference categories
* Gmail SMTP integration

---

### Infrastructure

* PostgreSQL persistence
* Prisma ORM
* Background schedulers
* Cache invalidation system
* High-read endpoint caching
* Dockerized infrastructure
* Automatic hostel bootstrap system

---

## Tech Stack

### Frontend

* Next.js 15
* React
* TypeScript
* Tailwind CSS

### Backend

* Express.js
* TypeScript
* Prisma ORM

### Database

* PostgreSQL

### Authentication

* JWT
* bcrypt

### Tooling

* Docker
* Docker Compose
* npm workspaces
* Prisma migrations

---

## Project Structure

```text
munchies/
│
├── backend/              Express API + Prisma backend
├── frontend/             Next.js frontend
├── scripts/              Helper scripts
├── shorcut script/       Windows batch scripts
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Environment Setup

### Backend Environment

Create:

```bash
backend/.env
```

Example:

```env
NODE_ENV="development"
PORT=5000

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/munchies?schema=public"

FRONTEND_ORIGIN="http://localhost:3000"

JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"

EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_gmail_app_password"
EMAIL_FROM="Munchies <your_email@gmail.com>"

ADMIN_EMAIL="your_admin_email@gmail.com"
```

---

### Frontend Environment

Create:

```bash
frontend/.env.local
```

Example:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:5000/api"
```

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd munchies
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Start PostgreSQL & Infrastructure

```bash
docker compose up -d
```

---

### 4. Generate Prisma Client

```bash
npm run prisma:generate --workspace backend
```

---

### 5. Apply Prisma Migrations

```bash
npm run prisma:migrate:deploy --workspace backend
```

---

### 6. Start Backend

```bash
npm run dev --workspace backend
```

---

### 7. Start Frontend

Open another terminal:

```bash
npm run dev --workspace frontend
```

---

## Default URLs

| Service       | URL                                |
| ------------- | ---------------------------------- |
| Frontend      | `http://localhost:3000`            |
| Backend API   | `http://localhost:5000/api`        |
| Health Check  | `http://localhost:5000/api/health` |
| Prisma Studio | `http://localhost:5555`            |

---

## Docker Commands

### Start Containers

```bash
docker compose up -d
```

---

### Stop Containers

```bash
docker compose down
```

---

### Reset Database Completely

```bash
docker compose down -v
```

Note:

* This removes PostgreSQL data completely.
* Default hostels are automatically recreated on startup.

---

### View Backend Logs

```bash
docker compose logs backend
```

---

### Restart Backend

```bash
docker compose restart backend
```

---

## Prisma Workflow

### Generate Prisma Client

```bash
npm run prisma:generate --workspace backend
```

---

### Create Migration

```bash
npm run prisma:migrate --workspace backend
```

---

### Deploy Existing Migrations

```bash
npm run prisma:migrate:deploy --workspace backend
```

---

### Open Prisma Studio

```bash
npm run prisma:studio --workspace backend
```

---

## Automatic Hostel Bootstrap

The backend automatically initializes the 12 predefined hostels during startup if they do not already exist in the database.

This ensures:

* fresh Docker resets still work
* no manual SQL setup is required
* hostel data always exists

---

## First Run Workflow

1. Register a normal user account.
2. Login using the email configured in:

```env
ADMIN_EMAIL
```

3. That account automatically receives `ADMIN` role access.
4. Submit a store ownership request as a normal user.
5. Approve the request from the admin dashboard.
6. Add inventory as the store owner.
7. Place bookings as a customer.

---

## API Overview

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

---

### Hostels

```http
GET /api/hostels
```

---

### Stores

```http
GET    /api/stores
GET    /api/stores/:id
POST   /api/stores
PATCH  /api/stores/:id
DELETE /api/stores/:id
```

---

### Inventory

```http
/api/stores/:storeId/items
```

---

### Cart

```http
/api/carts
```

---

### Bookings

```http
/api/bookings
```

---

### Ownership Requests

```http
/api/store-ownership-requests
/api/admin/store-ownership-requests
```

---

## Verification

### Frontend Typecheck

```bash
npm run typecheck --workspace frontend
```

---

### Backend Typecheck

```bash
npm run typecheck --workspace backend
```

---

### Production Build

```bash
npm run build
```

---

## Deployment

### Recommended Stack

| Service       | Platform         |
| ------------- | ---------------- |
| Frontend      | Vercel           |
| Backend       | Railway / Render |
| Database      | PostgreSQL       |
| Media Storage | Cloudinary       |

---

### Backend Deployment

Required environment variables:

```env
DATABASE_URL=
JWT_SECRET=
FRONTEND_ORIGIN=
EMAIL_USER=
EMAIL_PASS=
ADMIN_EMAIL=
```

Run migrations after deployment:

```bash
npx prisma migrate deploy
```

---

### Frontend Deployment

Required environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=
```

---

## Production Notes

* Configure secure JWT secrets
* Configure proper CORS origin
* Use persistent cloud storage for uploads
* Never commit `.env`
* Use production PostgreSQL backups
* Run migrations before production startup

---

## Future Improvements

* Payment gateway integration
* WebSocket real-time order updates
* Mobile/PWA support
* Recommendation engine
* Search optimization
* Push notifications

---

## License

This project is for educational and academic use.
