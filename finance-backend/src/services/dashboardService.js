const db = require('../config/db');

const getSummary = (userId, role) => {
  const condition = role === 'admin' ? '' : 'AND user_id = ?';
  const params = role === 'admin' ? [] : [userId];

  const base = `FROM financial_records WHERE deleted_at IS NULL ${condition}`;

  const totalIncome = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total ${base} AND type = 'income'`
  ).get(...params).total;

  const totalExpenses = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total ${base} AND type = 'expense'`
  ).get(...params).total;

  const recentRecords = db.prepare(
    `SELECT r.*, u.name as user_name
     FROM financial_records r
     JOIN users u ON r.user_id = u.id
     WHERE r.deleted_at IS NULL ${condition.replace('AND', 'AND r.')}
     ORDER BY r.date DESC LIMIT 5`
  ).all(...params);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    recentActivity: recentRecords
  };
};

const getByCategory = (userId, role) => {
  const condition = role === 'admin' ? '' : 'AND user_id = ?';
  const params = role === 'admin' ? [] : [userId];

  const rows = db.prepare(
    `SELECT category, type, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
     FROM financial_records
     WHERE deleted_at IS NULL ${condition}
     GROUP BY category, type
     ORDER BY total DESC`
  ).all(...params);

  // Group into income_categories and expense_categories
  const result = { income: {}, expense: {} };
  for (const row of rows) {
    result[row.type][row.category] = { total: row.total, count: row.count };
  }
  return result;
};

const getTrends = (userId, role, period = 'monthly') => {
  const condition = role === 'admin' ? '' : 'AND user_id = ?';
  const params = role === 'admin' ? [] : [userId];

  const format = period === 'weekly' ? '%Y-W%W' : '%Y-%m';

  const rows = db.prepare(
    `SELECT
       strftime('${format}', date) as period,
       type,
       COALESCE(SUM(amount), 0) as total,
       COUNT(*) as count
     FROM financial_records
     WHERE deleted_at IS NULL ${condition}
     GROUP BY period, type
     ORDER BY period ASC`
  ).all(...params);

  // Pivot into period → { income, expense, net }
  const map = {};
  for (const row of rows) {
    if (!map[row.period]) map[row.period] = { period: row.period, income: 0, expense: 0, net: 0 };
    map[row.period][row.type] = row.total;
    map[row.period].net = map[row.period].income - map[row.period].expense;
  }

  return Object.values(map);
};

module.exports = { getSummary, getByCategory, getTrends };
