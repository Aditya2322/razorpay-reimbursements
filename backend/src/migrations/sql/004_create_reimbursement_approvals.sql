-- Tracks every individual approval / rejection action for audit purposes.
CREATE TABLE IF NOT EXISTS reimbursement_approvals (
  id                  SERIAL PRIMARY KEY,
  reimbursement_id    INTEGER NOT NULL REFERENCES reimbursements(id) ON DELETE CASCADE,
  approver_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approver_role       user_role NOT NULL,
  action              reimbursement_status NOT NULL, -- APPROVED or REJECTED
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
