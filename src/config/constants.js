const ROLES = Object.freeze({
  EMP: 'EMP',
  RM: 'RM',
  APE: 'APE',
  CFO: 'CFO',
});

const REIMBURSEMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

const ALLOWED_EMAIL_DOMAIN = 'org.com';

module.exports = { ROLES, REIMBURSEMENT_STATUS, ALLOWED_EMAIL_DOMAIN };
