const router = require('express').Router();
const { query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const dashboardService = require('../services/dashboardService');
const { success, error } = require('../utils/response');

router.use(authenticate);

// GET /dashboard/summary
router.get('/summary', (req, res) => {
  try {
    const data = dashboardService.getSummary(req.user.id, req.user.role);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// GET /dashboard/by-category
router.get('/by-category', (req, res) => {
  try {
    const data = dashboardService.getByCategory(req.user.id, req.user.role);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

// GET /dashboard/trends?period=monthly|weekly
router.get('/trends', [
  query('period').optional().isIn(['monthly', 'weekly']).withMessage('period must be monthly or weekly'),
  validate
], (req, res) => {
  try {
    const data = dashboardService.getTrends(req.user.id, req.user.role, req.query.period);
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

module.exports = router;
