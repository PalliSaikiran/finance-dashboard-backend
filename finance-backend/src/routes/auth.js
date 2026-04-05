const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const authService = require('../services/authService');
const { success, error } = require('../utils/response');

// POST /auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role'),
  validate
], (req, res) => {
  try {
    const user = authService.register(req.body);
    return success(res, user, 'Registered successfully', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// POST /auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], (req, res) => {
  try {
    const data = authService.login(req.body);
    return success(res, data, 'Login successful');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// GET /auth/me
router.get('/me', authenticate, (req, res) => {
  return success(res, req.user);
});

module.exports = router;
