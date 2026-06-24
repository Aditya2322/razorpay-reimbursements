# Razorpay Reimbursements — Backend Assignment

Role-based access control for a reimbursements management tool.

## Stack

- **Runtime:** Node.js >= 20.10.2
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Auth:** JWT stored in httpOnly cookie

## Quick Start

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your PostgreSQL credentials:

```bash
cp .env.example .env
```

```
PORT=7002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=razorpay_reimbursements
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

### 3. Create the Database

```sql
CREATE DATABASE razorpay_reimbursements;
```

### 4. Run Migrations

```bash
npm run db:migrate
```

### 5. Seed the CFO Account

```bash
npm run db:seed-data
```

CFO credentials (seeded exactly as specified):
- **Email:** `cfo@org.com`
- **Password:** `CFO#ORG@April2026`

### 6. Start the Server

```bash
npm run dev
```

Server runs on **port 7002**.

---

## Project Structure

```
src/
├── config/
│   ├── constants.js          # ROLES, statuses, domain
│   └── db.js                 # pg Pool
├── controllers/
│   ├── onboarding.controller.js
│   ├── roles.controller.js
│   ├── employees.controller.js
│   └── reimbursements.controller.js
├── middlewares/
│   ├── auth.middleware.js     # JWT cookie verification
│   └── rbac.middleware.js     # Role guard factory
├── migrations/
│   ├── run.js                 # Migration runner
│   └── sql/                   # Ordered SQL files
│       ├── 001_create_users.sql
│       ├── 002_create_employee_rm_assignments.sql
│       ├── 003_create_reimbursements.sql
│       └── 004_create_reimbursement_approvals.sql
├── models/
│   ├── user.model.js
│   ├── assignment.model.js
│   └── reimbursement.model.js
├── routes/
│   ├── index.js
│   ├── onboarding.routes.js
│   ├── roles.routes.js
│   ├── employees.routes.js
│   └── reimbursements.routes.js
├── seeders/
│   └── cfo.seeder.js
└── index.js
```

---

## API Reference

All endpoints are prefixed with `/rest`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/rest/onboardings/register` | Public | Register (EMP role) |
| POST | `/rest/onboardings/login` | Public | Login, sets auth cookie |
| POST | `/rest/onboardings/logout` | Public | Clears auth cookie |

### Roles

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/rest/roles/assign` | CFO | Assign role to user |

### Employees

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/rest/employees` | RM/APE/CFO | List employees (role-filtered) |
| POST | `/rest/employees/assign` | CFO | Assign EMP to RM |
| DELETE | `/rest/employees/assign` | CFO | Remove EMP from RM |

### Reimbursements

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/rest/reimbursements` | EMP | Raise a reimbursement |
| PATCH | `/rest/reimbursements` | RM/APE/CFO | Approve or reject |
| GET | `/rest/reimbursements` | All | List (role-filtered) |
| GET | `/rest/reimbursements/:userId` | RM/APE/CFO | List for a subordinate EMP |

---

## Approval Flow

```
EMP raises → PENDING
      ↓
  RM approves (rm_approved = true)
      ↓
  APE approves (ape_approved = true)
      ↓
  Status shows APPROVED to EMP

  Any role (RM/APE/CFO) can REJECT at any stage → is_rejected = true
```

Status visible to EMP is derived:
- `is_rejected = true` → **REJECTED**
- `rm_approved AND ape_approved` → **APPROVED**
- otherwise → **PENDING**
