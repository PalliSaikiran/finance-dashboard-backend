# Finance Dashboard Backend

A role-based REST API backend for a finance dashboard system. Built with **Node.js + Express + SQLite**.

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js + Express | Fast to set up, clean middleware model |
| Database | SQLite (better-sqlite3) | Zero config, file-based, portable |
| Auth | JWT (jsonwebtoken) | Stateless, industry standard |
| Passwords | bcryptjs | Secure hashing |
| Validation | express-validator | Declarative, clean |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env

# 3. Seed demo data
npm run seed

# 4. Start server
npm start
# or for development with auto-reload:
npm run dev
```

Server starts at `http://localhost:3000`

---

## Demo Accounts (after seeding)

| Email | Password | Role |
|---|---|---|
| admin@example.com | password123 | admin |
| analyst@example.com | password123 | analyst |
| viewer@example.com | password123 | viewer |

---

## API Reference

All protected routes require: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register a new user |
| POST | `/auth/login` | ❌ | Login, returns JWT |
| GET | `/auth/me` | ✅ | Get current user |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "viewer"
}
```

**Login body:**
```json
{ "email": "admin@example.com", "password": "password123" }
```

---

### Financial Records

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/records` | all | List records (own records; admin sees all) |
| GET | `/records/:id` | all | Get a single record |
| POST | `/records` | admin | Create a record |
| PUT | `/records/:id` | admin | Update a record |
| DELETE | `/records/:id` | admin | Soft-delete a record |

**Query filters for GET /records:**

| Param | Type | Example |
|---|---|---|
| type | string | `income` or `expense` |
| category | string | `Salary` |
| from | date | `2024-01-01` |
| to | date | `2024-03-31` |
| page | int | `1` |
| limit | int | `10` (max 100) |

Example: `GET /records?type=expense&from=2024-01-01&page=1&limit=5`

**Create/Update body:**
```json
{
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "date": "2024-03-05",
  "notes": "March salary"
}
```

---

### Dashboard

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | all | Totals, net balance, recent activity |
| GET | `/dashboard/by-category` | all | Income/expense per category |
| GET | `/dashboard/trends` | all | Monthly or weekly trends |

**Trends:** `GET /dashboard/trends?period=monthly` (or `weekly`)

**Summary response:**
```json
{
  "totalIncome": 15800,
  "totalExpenses": 5900,
  "netBalance": 9900,
  "recentActivity": [...]
}
```

---

### Users (Admin only)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/users` | admin | List all users |
| GET | `/users/:id` | admin | Get a user |
| PATCH | `/users/:id/role` | admin | Update user role |
| PATCH | `/users/:id/status` | admin | Activate/deactivate user |

---

## Access Control Matrix

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| View own records | ✅ | ✅ | ✅ |
| View all records | ❌ | ❌ | ✅ |
| Dashboard summaries | ✅ | ✅ | ✅ |
| Create records | ❌ | ❌ | ✅ |
| Edit/Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## Project Structure

```
finance-backend/
├── app.js                    # Express app entry point
├── .env.example              # Environment config template
├── package.json
└── src/
    ├── config/
    │   ├── db.js             # SQLite connection + schema creation
    │   └── seed.js           # Demo data seeder
    ├── middleware/
    │   ├── auth.js           # JWT verify, attach req.user
    │   ├── roleGuard.js      # requireRole(), requireMinRole()
    │   └── validate.js       # express-validator error formatter
    ├── routes/
    │   ├── auth.js           # /auth/*
    │   ├── records.js        # /records/*
    │   ├── dashboard.js      # /dashboard/*
    │   └── users.js          # /users/*
    ├── services/
    │   ├── authService.js    # Register, login logic
    │   ├── recordService.js  # CRUD + filter + pagination
    │   └── dashboardService.js # Aggregations, trends
    └── utils/
        └── response.js       # Consistent { success, message, data } format
```

---

## Database Schema

```sql
users (
  id, name, email, password_hash,
  role CHECK(viewer|analyst|admin),
  status CHECK(active|inactive),
  created_at, updated_at
)

financial_records (
  id, user_id, amount, type CHECK(income|expense),
  category, date, notes,
  created_at, updated_at,
  deleted_at  -- soft delete: NULL means active
)
```

---

## Design Decisions & Assumptions

1. **Soft deletes** — Records are never hard-deleted. `deleted_at IS NULL` filters them from all queries. This preserves audit history.
2. **Viewers see only own data** — The assignment didn't specify; I assumed viewers and analysts are scoped to their own records. Only admins have a global view.
3. **Anyone can register** — Role defaults to `viewer`. Admins can upgrade via PATCH `/users/:id/role`. In a real system, admin registration would be restricted.
4. **Amounts are always positive** — The `type` field (income/expense) carries the sign; storing negative amounts would be redundant and error-prone.
5. **SQLite over PostgreSQL** — Chosen for zero-config portability. The query patterns are portable; swapping to PostgreSQL requires only changing the `db` driver.
6. **No refresh tokens** — JWT is set to 7-day expiry. A production system would add refresh token rotation.

---

## Response Format

All responses follow a consistent envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "amount", "message": "Amount must be positive" }]
}
```
