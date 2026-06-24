const express = require('express');
const router = express.Router();

const onboardingRoutes = require('./onboarding.routes');
const rolesRoutes = require('./roles.routes');
const employeesRoutes = require('./employees.routes');
const reimbursementsRoutes = require('./reimbursements.routes');

router.use('/onboardings', onboardingRoutes);
router.use('/roles', rolesRoutes);
router.use('/employees', employeesRoutes);
router.use('/reimbursements', reimbursementsRoutes);

module.exports = router;
