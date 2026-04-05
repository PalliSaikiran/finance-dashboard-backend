const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const db = require('../config/db');
const { success, error } = require('../utils/response');

router.use(authenticate, requireRole('admin'));

// GET /users
router.get('/', (req, res) => {
  const users = db.prepare(
    'SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC'
  ).all();
  return success(res, users);
});

// GET /users/:id
router.get('/:id', (req, res) => {
  const user = db.prepare(
    'SELECT id, name, email, role, status, created_at FROM users WHERE id = ?'
  ).get(req.params.id);

  if (!user) return error(res, 'User not found.', 404);
  return success(res, user);
});

// PATCH /users/:id/role
router.patch('/:id/role', [
  body('role').isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role'),
  validate
], (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return error(res, 'User not found.', 404);

  db.prepare(`UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(req.body.role, req.params.id);

  const updated = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?')
    .get(req.params.id);
  return success(res, updated, 'Role updated');
});

// PATCH /users/:id/status
router.patch('/:id/status', [
  body('status').isIn(['active', 'inactive']).withMessage('status must be active or inactive'),
  validate
], (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return error(res, 'User not found.', 404);

  // Prevent admin from deactivating themselves
  if (parseInt(req.params.id) === req.user.id && req.body.status === 'inactive') {
    return error(res, 'You cannot deactivate your own account.', 400);
  }

  db.prepare(`UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(req.body.status, req.params.id);

  const updated = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?')
    .get(req.params.id);
  return success(res, updated, 'Status updated');
});

module.exports = router;
