CREATE TYPE reimbursement_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE IF NOT EXISTS reimbursements (
  id          SERIAL PRIMARY KEY,
  emp_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,

  -- Internal tracking flags (not directly exposed to EMP)
  rm_approved  BOOLEAN NOT NULL DEFAULT FALSE,
  ape_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_rejected  BOOLEAN NOT NULL DEFAULT FALSE,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
