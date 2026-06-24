const UserModel = require('../models/user.model');
const { ROLES } = require('../config/constants');

const VALID_ROLES = Object.values(ROLES);

async function assignRole(req, res) {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'userId and role are required.',
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}.`,
      });
    }

    // Prevent reassigning CFO role — there should only ever be one CFO
    if (role === ROLES.CFO) {
      return res.status(400).json({
        status: 'error',
        message: 'The CFO role cannot be assigned via this endpoint.',
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.',
      });
    }

    // Prevent modifying the CFO's own role
    if (user.role === ROLES.CFO) {
      return res.status(400).json({
        status: 'error',
        message: "The CFO's role cannot be changed.",
      });
    }

    const updated = await UserModel.updateRole(userId, role);

    return res.status(200).json({
      status: 'success',
      data: {
        userId: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (err) {
    console.error('[assignRole]', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

module.exports = { assignRole };
