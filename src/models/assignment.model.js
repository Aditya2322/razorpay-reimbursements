const pool = require('../config/db');

const AssignmentModel = {
  async assign(empId, rmId) {
    // Upsert: if EMP already has an RM, replace it
    const { rows } = await pool.query(
      `INSERT INTO employee_rm_assignments (emp_id, rm_id)
       VALUES ($1, $2)
       ON CONFLICT (emp_id) DO UPDATE SET rm_id = EXCLUDED.rm_id
       RETURNING *`,
      [empId, rmId]
    );
    return rows[0];
  },

  async unassign(empId, rmId) {
    const { rowCount } = await pool.query(
      `DELETE FROM employee_rm_assignments
       WHERE emp_id = $1 AND rm_id = $2`,
      [empId, rmId]
    );
    return rowCount > 0;
  },

  async findByEmp(empId) {
    const { rows } = await pool.query(
      'SELECT * FROM employee_rm_assignments WHERE emp_id = $1',
      [empId]
    );
    return rows[0] || null;
  },

  async isEmpUnderRM(empId, rmId) {
    const { rows } = await pool.query(
      `SELECT id FROM employee_rm_assignments
       WHERE emp_id = $1 AND rm_id = $2`,
      [empId, rmId]
    );
    return rows.length > 0;
  },
};

module.exports = AssignmentModel;
