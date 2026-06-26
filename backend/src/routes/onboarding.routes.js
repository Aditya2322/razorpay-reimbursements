const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { register, login, logout, profile } = require('../controllers/onboarding.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, profile);

module.exports = router;
