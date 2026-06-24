const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { ALLOWED_EMAIL_DOMAIN } = require('../config/constants');

const SALT_ROUNDS = 10;

function isValidOrgEmail(email) {
  if (typeof email !== 'string') return false;
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 && parts[1] === ALLOWED_EMAIL_DOMAIN;
}

function issueAuthCookie(res, userId, role) {
  const token = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.cookie('auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'name, email, and password are required.',
      });
    }

    if (!isValidOrgEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: `Only @${ALLOWED_EMAIL_DOMAIN} email addresses are allowed.`,
      });
    }

    const existing = await UserModel.findByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: passwordHash,
    });

    issueAuthCookie(res, user.id, user.role);

    return res.status(201).json({
      status: 'success',
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'email and password are required.',
      });
    }

    if (!isValidOrgEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: `Only @${ALLOWED_EMAIL_DOMAIN} email addresses are allowed.`,
      });
    }

    const user = await UserModel.findByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    issueAuthCookie(res, user.id, user.role);

    return res.status(200).json({
      status: 'success',
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

async function logout(req, res) {
  try {
    res.clearCookie('auth', { httpOnly: true, sameSite: 'lax' });
    return res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
  } catch (err) {
    console.error('[logout]', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

module.exports = { register, login, logout };
