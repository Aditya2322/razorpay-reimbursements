const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const {
  createReimbursement,
  updateReimbursement,
  listReimbursements,
  listReimbursementsForUser,
} = require('../controllers/reimbursements.controller');

// POST — only EMP can raise a reimbursement
router.post('/', authenticate, authorize('EMP'), createReimbursement);

// PATCH — RM, APE, CFO can approve/reject
router.patch('/', authenticate, authorize('RM', 'APE', 'CFO'), updateReimbursement);

// GET / — role-filtered list (all authenticated roles)
router.get('/', authenticate, listReimbursements);

// GET /:userId — subordinate's reimbursements (RM, APE, CFO)
router.get('/:userId', authenticate, authorize('RM', 'APE', 'CFO'), listReimbursementsForUser);

module.exports = router;
