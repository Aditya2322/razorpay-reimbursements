const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { assignRole } = require('../controllers/roles.controller');

router.post('/assign', authenticate, authorize('CFO'), assignRole);

module.exports = router;
