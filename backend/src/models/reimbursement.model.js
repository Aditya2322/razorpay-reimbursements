const pool = require('../config/db');

/**
 * Derives the status visible to an EMP from internal approval flags:
 *  - is_rejected  => REJECTED
 *  - rm_approved AND ape_approved => APPROVED
 *  - otherwise => PENDING
 */
function deriveStatus(row) {
  if (row.is_rejected) return 'REJECTED';
  if (row.rm_approved && row.ape_approved) return 'APPROVED';
  return 'PENDING';
}

const ReimbursementModel = {
  async create({ empId, title, description, amount }) {
    const { rows } = await pool.query(
      `INSERT INTO reimbursements (emp_id, title, description, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [empId, title, description, amount]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM reimbursements WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  // EMP sees their own reimbursements with derived status
  async findByEmp(empId) {
    const { rows } = await pool.query(
      `SELECT id, title, description, amount,
              rm_approved, ape_approved, is_rejected
       FROM reimbursements
       WHERE emp_id = $1
       ORDER BY created_at DESC`,
      [empId]
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      amount: parseFloat(r.amount),
      status: deriveStatus(r),
    }));
  },

  // RM sees PENDING reimbursements from their direct reports
  async findPendingForRM(rmId) {
    const { rows } = await pool.query(
      `SELECT r.id, r.title, r.description, r.amount,
              r.rm_approved, r.ape_approved, r.is_rejected
       FROM reimbursements r
       JOIN employee_rm_assignments a ON a.emp_id = r.emp_id
       WHERE a.rm_id = $1
         AND r.is_rejected = FALSE
         AND r.rm_approved = FALSE
       ORDER BY r.created_at DESC`,
      [rmId]
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      amount: parseFloat(r.amount),
      status: 'PENDING',
    }));
  },

  // APE sees reimbursements that RM has approved but APE hasn't yet acted on
  async findPendingForAPE() {
    const { rows } = await pool.query(
      `SELECT id, title, description, amount,
              rm_approved, ape_approved, is_rejected
       FROM reimbursements
       WHERE rm_approved = TRUE
         AND ape_approved = FALSE
         AND is_rejected = FALSE
       ORDER BY created_at DESC`
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      amount: parseFloat(r.amount),
      status: 'PENDING',
    }));
  },

  // CFO sees reimbursements that both RM and APE have approved
  async findApprovedForCFO() {
    const { rows } = await pool.query(
      `SELECT id, title, description, amount,
              rm_approved, ape_approved, is_rejected
       FROM reimbursements
       WHERE rm_approved = TRUE
         AND ape_approved = TRUE
         AND is_rejected = FALSE
       ORDER BY created_at DESC`
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      amount: parseFloat(r.amount),
      status: 'APPROVED',
    }));
  },

  // All reimbursements for a specific EMP (for RM/APE/CFO subordinate lookup)
  async findAllByEmpId(empId) {
    const { rows } = await pool.query(
      `SELECT id, title, description, amount,
              rm_approved, ape_approved, is_rejected
       FROM reimbursements
       WHERE emp_id = $1
       ORDER BY created_at DESC`,
      [empId]
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      amount: parseFloat(r.amount),
      status: deriveStatus(r),
    }));
  },

  async approveByRM(reimbursementId, approverId) {
    const { rows } = await pool.query(
      `UPDATE reimbursements
       SET rm_approved = TRUE, updated_at = NOW()
       WHERE id = $1 AND is_rejected = FALSE
       RETURNING *`,
      [reimbursementId]
    );
    if (rows[0]) {
      await pool.query(
        `INSERT INTO reimbursement_approvals
           (reimbursement_id, approver_id, approver_role, action)
         VALUES ($1, $2, 'RM', 'APPROVED')`,
        [reimbursementId, approverId]
      );
    }
    return rows[0] || null;
  },

  async approveByAPE(reimbursementId, approverId) {
    const { rows } = await pool.query(
      `UPDATE reimbursements
       SET ape_approved = TRUE, updated_at = NOW()
       WHERE id = $1 AND rm_approved = TRUE AND is_rejected = FALSE
       RETURNING *`,
      [reimbursementId]
    );
    if (rows[0]) {
      await pool.query(
        `INSERT INTO reimbursement_approvals
           (reimbursement_id, approver_id, approver_role, action)
         VALUES ($1, $2, 'APE', 'APPROVED')`,
        [reimbursementId, approverId]
      );
    }
    return rows[0] || null;
  },

  async reject(reimbursementId, approverId, approverRole) {
    const { rows } = await pool.query(
      `UPDATE reimbursements
       SET is_rejected = TRUE, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [reimbursementId]
    );
    if (rows[0]) {
      await pool.query(
        `INSERT INTO reimbursement_approvals
           (reimbursement_id, approver_id, approver_role, action)
         VALUES ($1, $2, $3, 'REJECTED')`,
        [reimbursementId, approverId, approverRole]
      );
    }
    return rows[0] || null;
  },

  // CFO acts as override approver — can approve at both RM and APE level
  async approveByCFO(reimbursementId, approverId) {
    const { rows } = await pool.query(
      `UPDATE reimbursements
       SET rm_approved = TRUE, ape_approved = TRUE, updated_at = NOW()
       WHERE id = $1 AND is_rejected = FALSE
       RETURNING *`,
      [reimbursementId]
    );
    if (rows[0]) {
      await pool.query(
        `INSERT INTO reimbursement_approvals
           (reimbursement_id, approver_id, approver_role, action)
         VALUES ($1, $2, 'CFO', 'APPROVED')`,
        [reimbursementId, approverId]
      );
    }
    return rows[0] || null;
  },
};

module.exports = ReimbursementModel;
