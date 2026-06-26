/**
 * Returns an Express middleware that allows only users whose role is in
 * the given list. Must be used after the authenticate middleware.
 *
 * Usage: authorize('CFO')  or  authorize('RM', 'APE', 'CFO')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.',
      });
    }

    next();
  };
}

module.exports = { authorize };
