# ReimburseFlow — Razorpay Backend Assignment

Role-based reimbursement management system built with Express.js, PostgreSQL (Supabase), and a dark-themed frontend.

---

## Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Supabase)
- **Auth:** JWT stored in httpOnly cookie
- **Frontend:** HTML, CSS, Vanilla JS (served from `/public`)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env` file
```
PORT=7002
DB_HOST=your-supabase-host.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-supabase-password
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

### 3. Run migrations
```bash
npm run db:migrate
```

### 4. Seed CFO account
```bash
npm run db:seed-data
```

### 5. Start server
```bash
npm run dev
```

### 6. Open browser
```
http://localhost:7002
```

---

## Test Accounts

### Admin (CFO) — Seeded automatically
```
Email:    cfo@org.com
Password: CFO#ORG@April2026
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

## API Endpoints

All endpoints are under `/rest` prefix.

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/rest/onboardings/register` | Public | Register (EMP role) |
| POST | `/rest/onboardings/login` | Public | Login |
| POST | `/rest/onboardings/logout` | Public | Logout |
| POST | `/rest/roles/assign` | CFO | Assign role to user |
| GET | `/rest/employees` | RM/APE/CFO | List employees |
| POST | `/rest/employees/assign` | CFO | Assign EMP to RM |
| DELETE | `/rest/employees/assign` | CFO | Remove EMP from RM |
| POST | `/rest/reimbursements` | EMP | Create reimbursement |
| GET | `/rest/reimbursements` | All | List (role-filtered) |
| PATCH | `/rest/reimbursements` | RM/APE/CFO | Approve or reject |
| GET | `/rest/reimbursements/:userId` | RM/APE/CFO | View subordinate's requests |

---

## Project Structure

```
src/
├── config/         DB connection, constants
├── controllers/    onboarding, roles, employees, reimbursements
├── middlewares/    auth (JWT), rbac (role guard)
├── migrations/     SQL migration runner + 4 migration files
├── models/         user, assignment, reimbursement
├── routes/         all routes under /rest
├── seeders/        CFO seed
└── index.js        Express entry point (port 7002)
public/
└── index.html      Frontend dashboard
```
