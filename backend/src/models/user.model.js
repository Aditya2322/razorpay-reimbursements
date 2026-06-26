const pool = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, email, password }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'EMP')
       RETURNING id, name, email, role`,
      [name, email, password]
    );
    return rows[0];
  },

  async updateRole(userId, role) {
    const { rows } = await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role`,
      [role, userId]
    );
    return rows[0] || null;
  },

  // Returns all users except CFO
  async findAll() {
    const { rows } = await pool.query(
      `SELECT id AS "userId", name, email, role
       FROM users
       WHERE role != 'CFO'
       ORDER BY id`
    );
    return rows;
  },

  // Returns only EMPs and RMs (for APE visibility)
  async findEMPsAndRMs() {
    const { rows } = await pool.query(
      `SELECT id AS "userId", name, email, role
       FROM users
       WHERE role IN ('EMP', 'RM')
       ORDER BY id`
    );
    return rows;
  },

  // Returns EMPs that report to a given RM
  async findEMPsByRM(rmId) {
    const { rows } = await pool.query(
      `SELECT u.id AS "userId", u.name, u.email, u.role
       FROM users u
       JOIN employee_rm_assignments a ON a.emp_id = u.id
       WHERE a.rm_id = $1
       ORDER BY u.id`,
      [rmId]
    );
    return rows;
  },
};

module.exports = UserModel;
