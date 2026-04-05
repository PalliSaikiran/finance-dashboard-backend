const { error } = require('../utils/response');

// Role hierarchy: viewer < analyst < admin
const ROLE_LEVELS = { viewer: 1, analyst: 2, admin: 3 };

/**
 * Restrict access to specific roles
 * Usage: requireRole('admin') or requireRole('analyst', 'admin')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Authentication required.', 401);

    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

/**
 * Restrict access to users with at least a minimum role level
 * Usage: requireMinRole('analyst') — allows analyst and admin
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Authentication required.', 401);

    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const minLevel = ROLE_LEVELS[minRole] || 0;

    if (userLevel < minLevel) {
      return error(res, `Access denied. Minimum role required: ${minRole}.`, 403);
    }

    next();
  };
};

module.exports = { requireRole, requireMinRole };
