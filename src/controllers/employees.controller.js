const UserModel = require('../models/user.model');
const AssignmentModel = require('../models/assignment.model');
const { ROLES } = require('../config/constants');

async function listEmployees(req, res) {
  try {
    const { role, id } = req.user;
    let users = [];

    if (role === ROLES.RM) {
      users = await UserModel.findEMPsByRM(id);
    } else if (role === ROLES.APE) {
      users = await UserModel.findEMPsAndRMs();
    } else if (role === ROLES.CFO) {
      users = await UserModel.findAll();
    } else {
      // EMP is not allowed
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view the employee list.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { users },
    });
  } catch (err) {
    console.error('[listEmployees]', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

async function assignEmployee(req, res) {
  try {
    const { userId: empId, rmId } = req.body;

    // The spec says both fields are named userId; we accept empId/rmId for clarity
    // but also handle the case where the caller sends { userId, rmId } or two userId fields
    const resolvedEmpId = empId;
    const resolvedRmId = rmId ?? req.body.rmUserId;

    if (!resolvedEmpId || !resolvedRmId) {
      return res.status(400).json({
        status: 'error',
        message: 'userId (of EMP) and rmId (of RM) are required.',
      });
    }

    const emp = await UserModel.findById(resolvedEmpId);
    if (!emp || emp.role !== ROLES.EMP) {
      return res.status(400).json({
        status: 'error',
        message: 'The first userId must belong to a user with role EMP.',
      });
    }

    const rm = await UserModel.findById(resolvedRmId);
    if (!rm || rm.role !== ROLES.RM) {
      return res.status(400).json({
        status: 'error',
        message: 'The second userId must belong to a user with role RM.',
      });
    }

    await AssignmentModel.assign(resolvedEmpId, resolvedRmId);

    return res.status(200).json({
      status: 'success',
      message: `Employee ${emp.name} assigned to RM ${rm.name}.`,
    });
  } catch (err) {
    console.error('[assignEmployee]', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

async function unassignEmployee(req, res) {
  try {
    const { userId: empId, rmId } = req.body;
    const resolvedRmId = rmId ?? req.body.rmUserId;

    if (!empId || !resolvedRmId) {
      return res.status(400).json({
        status: 'error',
        message: 'userId (of EMP) and rmId (of RM) are required.',
      });
    }

    const emp = await UserModel.findById(empId);
    if (!emp) {
      return res.status(404).json({ status: 'error', message: 'Employee not found.' });
    }

    const rm = await UserModel.findById(resolvedRmId);
    if (!rm) {
      return res.status(404).json({ status: 'error', message: 'Reporting Manager not found.' });
    }

    const removed = await AssignmentModel.unassign(empId, resolvedRmId);
    if (!removed) {
      return res.status(404).json({
        status: 'error',
        message: 'No such assignment exists between this EMP and RM.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Assignment between ${emp.name} and ${rm.name} removed.`,
    });
  } catch (err) {
    console.error('[unassignEmployee]', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

module.exports = { listEmployees, assignEmployee, unassignEmployee };
