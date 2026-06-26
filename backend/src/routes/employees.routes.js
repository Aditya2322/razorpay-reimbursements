const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const {
  listEmployees,
  assignEmployee,
  unassignEmployee,
} = require('../controllers/employees.controller');

// GET — role-filtered employee list (EMP not allowed, handled in controller)
router.get('/', authenticate, listEmployees);

// POST /assign — CFO only
router.post('/assign', authenticate, authorize('CFO'), assignEmployee);

// DELETE /assign — CFO only
router.delete('/assign', authenticate, authorize('CFO'), unassignEmployee);

module.exports = router;
