const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const register = ({ name, email, password, role = 'viewer' }) => {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw { status: 409, message: 'Email already registered.' };

  const password_hash = bcrypt.hashSync(password, 10);

  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, password_hash, role);

  return db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid);
};

const login = ({ email, password }) => {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) throw { status: 401, message: 'Invalid email or password.' };
  if (user.status === 'inactive') throw { status: 403, message: 'Account is inactive.' };

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Invalid email or password.' };

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
};

module.exports = { register, login };
