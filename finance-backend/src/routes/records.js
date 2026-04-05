const router = require('express').Router();
const { body, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const recordService = require('../services/recordService');
const { success, error } = require('../utils/response');

// All record routes require authentication
router.use(authenticate);

// GET /records — viewers see own, analysts see own, admins see all
router.get('/', [
  query('type').optional().isIn(['income', 'expense']).withMessage('type must be income or expense'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  validate
], (req, res) => {
  try {
    const data = recordService.getAll({ ...req.query, userId: req.user.id, role: req.user.role });
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// GET /records/:id
router.get('/:id', (req, res) => {
  try {
    const record = recordService.getById(parseInt(req.params.id), req.user.id, req.user.role);
    return success(res, record);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// POST /records — admin only
router.post('/', requireRole('admin'), [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('type').isIn(['income', 'expense']).withMessage('type must be income or expense'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('date').isISO8601().withMessage('Date must be a valid date (YYYY-MM-DD)'),
  body('notes').optional().isString(),
  validate
], (req, res) => {
  try {
    const record = recordService.create({ ...req.body, user_id: req.user.id });
    return success(res, record, 'Record created', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// PUT /records/:id — admin only
router.put('/:id', requireRole('admin'), [
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('type').optional().isIn(['income', 'expense']),
  body('category').optional().trim().notEmpty(),
  body('date').optional().isISO8601(),
  body('notes').optional().isString(),
  validate
], (req, res) => {
  try {
    const record = recordService.update(parseInt(req.params.id), req.body);
    return success(res, record, 'Record updated');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// DELETE /records/:id — admin only (soft delete)
router.delete('/:id', requireRole('admin'), (req, res) => {
  try {
    const result = recordService.softDelete(parseInt(req.params.id));
    return success(res, result, 'Record deleted');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

module.exports = router;
