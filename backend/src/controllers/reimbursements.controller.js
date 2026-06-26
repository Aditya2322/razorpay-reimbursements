const ReimbursementModel = require('../models/reimbursement.model');
const UserModel = require('../models/user.model');
const AssignmentModel = require('../models/assignment.model');
const { ROLES, REIMBURSEMENT_STATUS } = require('../config/constants');

// POST /rest/reimbursements — EMP raises a reimbursement
async function createReimbursement(req, res) {
  try {
    const { title, description, amount } = req.body;

    if (!title || !description || amount === undefined || amount === null) {
      return res.status(400).json({
        status: 'error',
        message: 'title, description, and amount are required.',
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'amount must be a positive number.',
      });
    }

    const reimbursement = await ReimbursementModel.create({
      empId: req.user.id,
      title: title.trim(),
      description: description.trim(),
      amount: parsedAmount,
    });

    return res.status(201).json({
      status: 'success',
      data: {
        reimbursementId: reimbursement.id,
        title: reimbursement.title,
        description: reimbursement.description,
        amount: parseFloat(reimbursement.amount),
        status: REIMBURSEMENT_STATUS.PENDING,
      },
    });
  } catch (err) {
    console.error('[createReimbursement]', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

// PATCH /rest/reimbursements — RM/APE/CFO approves or rejects
async function updateReimbursement(req, res) {
  try {
    const { userId: reimbursementId, status } = req.body;
    const { role, id: actorId } = req.user;

    if (!reimbursementId || !status) {
      return res.status(400).json({
        status: 'error',
        message: 'userId (reimbursementId) and status are required.',
      });
    }

    const validStatuses = [REIMBURSEMENT_STATUS.APPROVED, REIMBURSEMENT_STATUS.REJECTED];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `status must be one of: ${validStatuses.join(', ')}.`,
      });
    }

    const reimbursement = await ReimbursementModel.findById(reimbursementId);
    if (!reimbursement) {
      return res.status(404).json({
        status: 'error',
        message: 'Reimbursement not found.',
      });
    }

    // Cannot act on an already-rejected reimbursement
    if (reimbursement.is_rejected) {
      return res.status(400).json({
        status: 'error',
        message: 'This reimbursement has already been rejected.',
      });
    }

    if (status === REIMBURSEMENT_STATUS.REJECTED) {
      await ReimbursementModel.reject(reimbursementId, actorId, role);
      return res.status(200).json({ status: 'success', message: 'Reimbursement rejected.' });
    }

    // APPROVED path — each role acts on their layer
    if (role === ROLES.RM) {
      // RM can only approve reimbursements from their direct reports
      const assignment = await AssignmentModel.findByEmp(reimbursement.emp_id);
      if (!assignment || assignment.rm_id !== actorId) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only approve reimbursements from your direct reports.',
        });
      }

      if (reimbursement.rm_approved) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already approved this reimbursement.',
        });
      }

      await ReimbursementModel.approveByRM(reimbursementId, actorId);
    } else if (role === ROLES.APE) {
      if (!reimbursement.rm_approved) {
        return res.status(400).json({
          status: 'error',
          message: 'This reimbursement must be approved by the RM first.',
        });
      }

      if (reimbursement.ape_approved) {
        return res.status(400).json({
          status: 'error',
          message: 'An APE has already approved this reimbursement.',
        });
      }

      await ReimbursementModel.approveByAPE(reimbursementId, actorId);
    } else if (role === ROLES.CFO) {
      if (reimbursement.rm_approved && reimbursement.ape_approved) {
        return res.status(400).json({
          status: 'error',
          message: 'This reimbursement is already fully approved.',
        });
      }

      await ReimbursementModel.approveByCFO(reimbursementId, actorId);
    }

    return res.status(200).json({ status: 'success', message: 'Reimbursement approved.' });
  } catch (err) {
    console.error('[updateReimbursement]', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

// GET /rest/reimbursements — role-filtered list
async function listReimbursements(req, res) {
  try {
    const { role, id } = req.user;
    let reimbursements = [];

    if (role === ROLES.EMP) {
      reimbursements = await ReimbursementModel.findByEmp(id);
    } else if (role === ROLES.RM) {
      reimbursements = await ReimbursementModel.findPendingForRM(id);
    } else if (role === ROLES.APE) {
      reimbursements = await ReimbursementModel.findPendingForAPE();
    } else if (role === ROLES.CFO) {
      reimbursements = await ReimbursementModel.findApprovedForCFO();
    }

    return res.status(200).json({
      status: 'success',
      data: { reimbursements },
    });
  } catch (err) {
    console.error('[listReimbursements]', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

// GET /rest/reimbursements/:userId — list for a subordinate EMP
async function listReimbursementsForUser(req, res) {
  try {
    const targetId = parseInt(req.params.userId, 10);
    const { role, id: requesterId } = req.user;

    if (isNaN(targetId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid user ID.' });
    }

    const targetUser = await UserModel.findById(targetId);
    if (!targetUser || targetUser.role !== ROLES.EMP) {
      return res.status(404).json({
        status: 'error',
        message: 'Target user not found or is not an EMP.',
      });
    }

    // Verify the requester has authority over this EMP
    let isAuthorized = false;

    if (role === ROLES.RM) {
      isAuthorized = await AssignmentModel.isEmpUnderRM(targetId, requesterId);
    } else if (role === ROLES.APE || role === ROLES.CFO) {
      // APE and CFO can view any EMP's reimbursements
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this employee\'s reimbursements.',
      });
    }

    const reimbursements = await ReimbursementModel.findAllByEmpId(targetId);

    return res.status(200).json({
      status: 'success',
      data: { reimbursements },
    });
  } catch (err) {
    console.error('[listReimbursementsForUser]', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

module.exports = {
  createReimbursement,
  updateReimbursement,
  listReimbursements,
  listReimbursementsForUser,
};
