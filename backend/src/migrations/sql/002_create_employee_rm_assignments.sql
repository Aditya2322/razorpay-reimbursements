-- Maps each EMP to exactly one RM.
-- An EMP can only be assigned to one RM at a time (enforced by UNIQUE on emp_id).
CREATE TABLE IF NOT EXISTS employee_rm_assignments (
  id         SERIAL PRIMARY KEY,
  emp_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rm_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_emp_assignment UNIQUE (emp_id)
);
