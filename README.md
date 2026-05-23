# Munchies Marketplace System

Munchies is a hostel-based marketplace platform where students can operate small food stores from hostel rooms. Users can browse stores, request store ownership, and view available food stores. Store owners can manage their stores and inventory, while admins handle store owner approval requests.

This project follows the SWD Induction Round 3 task brief for a hostel-based marketplace system.

## Project Objective

The objective of Munchies is to model a real-world marketplace with:

- role-based access control
- store owner approval workflow
- public store discovery
- store and inventory management
- modular backend architecture
- clean database schema design
- production-readiness practices

## Mandatory Stack

Frontend:

- Next.js
- TypeScript
- Tailwind CSS

Backend:

- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

Authentication and tooling:

- JWT
- bcrypt
- ESLint
- Prettier

Planned later from the task brief:

- Nodemailer for email notifications
- caching for high-read endpoints
- background jobs for automation

## Roles

The platform supports three roles:

- `USER`
- `STORE_OWNER`
- `ADMIN`

## Implemented Scope

### Authentication and RBAC

- User registration
- User login
- Password hashing with bcrypt
- JWT authentication
- Current user endpoint
- Authentication middleware
- Role middleware

### Store Owner Request Workflow

- Users can request store ownership.
- Admins can approve or reject requests.
- Approved users become `STORE_OWNER`.

### Public Store System

- Public homepage
- Store listing
- Store search
- Hostel labels
- Hostel selection for store forms
- Store detail page
- Responsive UI

### Store Management

- Store owners can create stores.
- Store owners can edit store details.
- Store owners can manage room numbers.
- Store ownership is validated before updates.

### Inventory Management

- Store owners can create items.
- Store owners can update items.
- Store owners can delete items.
- Items support:
  - image upload
  - name
  - description
  - category
  - price
  - stock quantity
- Stock and ownership validation are handled on the backend.

## Task Brief Phase Mapping

### Phase 1: Core Marketplace

Implemented:

- authentication
- role-based access control
- store owner request workflow
- public homepage
- store listing
- store management
- inventory management with image uploads

Pending:

- active sale campaign banner carousel
- cart system
- checkout flow
- booking creation
- inventory updates during booking operations

### Phase 2: Governance and Policy Enforcement

Pending:

- booking cancellation workflow
- cancellation approval or rejection
- cancellation email notifications
- 24-hour uncollected order policy
- warning system
- user blocking controls

### Phase 3: Promotional Campaigns and Communication

Pending:

- coupon-based sale campaigns
- campaign activation and expiry
- coupon usage limits
- email subscription preferences
- Nodemailer integration

### Phase 4: Analytics and Performance

Pending:

- store owner analytics
- user analytics
- low stock alerts
- caching
- background automation

## Main Pages

Frontend routes:

- `/`
- `/login`
- `/register`
- `/stores/[id]`
- `/store-owner-request`
- `/admin/store-owner-requests`
- `/store-owner/stores`
- `/store-owner/inventory`

## API Overview

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Store owner requests:

- `POST /api/store-ownership-requests`
- `GET /api/admin/store-ownership-requests`
- `PATCH /api/admin/store-ownership-requests/:id/approve`
- `PATCH /api/admin/store-ownership-requests/:id/reject`

Stores:

- `GET /api/hostels`
- `GET /api/stores`
- `GET /api/stores/:id`
- `GET /api/stores/my-stores`
- `POST /api/stores`
- `PATCH /api/stores/:id`
- `DELETE /api/stores/:id`

Inventory:

- `GET /api/stores/:storeId/items`
- `POST /api/stores/:storeId/items`
- `PATCH /api/stores/:storeId/items/:itemId`
- `DELETE /api/stores/:storeId/items/:itemId`

## Project Structure

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
      config/
      controllers/
      middleware/
      prisma/
      routes/
      services/
      utils/
      validators/
```

## Environment Variables

Backend `.env`:

```env
NODE_ENV="development"
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/munchies?schema=public"
FRONTEND_ORIGIN="http://localhost:3000"
JWT_SECRET="replace-with-a-secure-secret"
JWT_EXPIRES_IN="7d"
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:5000/api"
```

## Local Setup

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npm run prisma:generate --workspace backend
```

Create/update database tables:

```bash
npm run db:push --workspace backend
```

Seed the 12 hostels:

```bash
npm run prisma:seed --workspace backend
```

Run both frontend and backend:

```bash
npm run dev
```

Run frontend only:

```bash
npm run dev --workspace frontend
```

Run backend only:

```bash
npm run dev --workspace backend
```

## Verification Commands

```bash
npm run lint
npm run format:check
npm run typecheck --workspace frontend
npm run typecheck --workspace backend
npm run build
```

## Notes

- Backend code follows a controller-service structure.
- Prisma is used for database schema and relations.
- Protected APIs use JWT authentication.
- Role checks are enforced through middleware.
- Input validation is handled before controller logic.
- Uploaded item images are served from the backend `/uploads` route.
