const db = require('../config/db');

const getAll = ({ type, category, from, to, page = 1, limit = 10, userId, role }) => {
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  // Viewers and analysts only see their own records; admins see all
  if (role !== 'admin') {
    conditions.push('user_id = ?');
    params.push(userId);
  }

  if (type) { conditions.push('type = ?'); params.push(type); }
  if (category) { conditions.push('category = ?'); params.push(category); }
  if (from) { conditions.push('date >= ?'); params.push(from); }
  if (to) { conditions.push('date <= ?'); params.push(to); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const total = db.prepare(`SELECT COUNT(*) as count FROM financial_records ${where}`)
    .get(...params).count;

  const records = db.prepare(
    `SELECT r.*, u.name as user_name
     FROM financial_records r
     JOIN users u ON r.user_id = u.id
     ${where}
     ORDER BY r.date DESC, r.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  return {
    records,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

const getById = (id, userId, role) => {
  const record = db.prepare(
    'SELECT * FROM financial_records WHERE id = ? AND deleted_at IS NULL'
  ).get(id);

  if (!record) throw { status: 404, message: 'Record not found.' };

  // Non-admins can only access their own records
  if (role !== 'admin' && record.user_id !== userId) {
    throw { status: 403, message: 'Access denied.' };
  }

  return record;
};

const create = ({ user_id, amount, type, category, date, notes }) => {
  const result = db.prepare(
    'INSERT INTO financial_records (user_id, amount, type, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(user_id, amount, type, category, date, notes || null);

  return db.prepare('SELECT * FROM financial_records WHERE id = ?').get(result.lastInsertRowid);
};

const update = (id, { amount, type, category, date, notes }) => {
  const record = db.prepare('SELECT * FROM financial_records WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!record) throw { status: 404, message: 'Record not found.' };

  db.prepare(`
    UPDATE financial_records
    SET amount = ?, type = ?, category = ?, date = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    amount ?? record.amount,
    type ?? record.type,
    category ?? record.category,
    date ?? record.date,
    notes !== undefined ? notes : record.notes,
    id
  );

  return db.prepare('SELECT * FROM financial_records WHERE id = ?').get(id);
};

const softDelete = (id) => {
  const record = db.prepare('SELECT * FROM financial_records WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!record) throw { status: 404, message: 'Record not found.' };

  db.prepare(`UPDATE financial_records SET deleted_at = datetime('now') WHERE id = ?`).run(id);
  return { id, deleted: true };
};

module.exports = { getAll, getById, create, update, softDelete };
