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

## Test Accounts

### Admin (CFO) — Seeded automatically
```
Email:    cfo@org.com

```

### Register these accounts manually via the app

**Reporting Manager:**
```
Name:     John Manager
Email:    john@org.com
Password: John@1234
```

**Employee:**
```
Name:     Jane Employee
Email:    jane@org.com
Password: Jane@1234
```

**Accounts Payable Executive:**
```
Name:     Alice APE
Email:    alice@org.com
Password: Alice@1234
```

> ⚠️ Only `@org.com` emails are allowed.

---

## How to Test All Pages & Roles

### Step 1 — Setup users (do this first)

1. Register **John Manager** → `john@org.com`
2. Register **Jane Employee** → `jane@org.com`
3. Register **Alice APE** → `alice@org.com`

---

### Step 2 — Login as CFO and do admin setup

Login: `cfo@org.com` / `CFO#ORG@April2026`

Go to **Admin** page:

**Assign Roles:**
| User ID | Role |
|---------|------|
| 2 | RM |
| 3 | EMP (Jane) |
| 4 | APE |

> Check IDs in the **Employees** page

**Assign Employee to RM:**
```
EMP User ID: Jane's ID
RM User ID:  John's ID
```

---

### Step 3 — Check Employees page (3 roles)

| Login as | What you see |
|----------|-------------|
| CFO | Everyone (EMP, RM, APE) |
| RM (John) | Only his direct EMPs |
| APE (Alice) | All EMPs and RMs |
| EMP (Jane) | ❌ Not allowed |

---

### Step 4 — Test Reimbursement flow

**A. EMP submits a request:**
- Login as `jane@org.com`
- Go to **Reimbursements** → click **New Request**
- Fill in title, description, amount → Submit
- Status shows: **PENDING**

**B. RM approves:**
- Login as `john@org.com`
- Go to **Reimbursements**
- See Jane's pending request → click **Approve**

**C. APE approves:**
- Login as `alice@org.com`
- Go to **Reimbursements**
- See request (already approved by RM) → click **Approve**

**D. EMP checks final status:**
- Login as `jane@org.com`
- Go to **Reimbursements**
- Status now shows: **APPROVED** ✅

**E. CFO sees fully approved list:**
- Login as `cfo@org.com`
- Go to **Reimbursements**
- Jane's request appears as **APPROVED**

---

### Step 5 — Test Rejection

- Login as `john@org.com` (RM)
- Go to **Reimbursements** → click **Reject** on any request
- Login as `jane@org.com` → status shows **REJECTED** ❌

---

## Reimbursement Status Rules

```
EMP submits → PENDING
RM approves → still PENDING (waiting for APE)
APE approves → APPROVED ✅
Any role rejects → REJECTED ❌
```

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
