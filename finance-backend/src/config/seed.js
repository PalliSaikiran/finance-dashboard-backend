require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

console.log('Seeding database...');

// Clear existing data
db.exec(`DELETE FROM financial_records; DELETE FROM users;`);

// Create users
const insertUser = db.prepare(`
  INSERT INTO users (name, email, password_hash, role, status)
  VALUES (?, ?, ?, ?, 'active')
`);

const password = bcrypt.hashSync('password123', 10);

const admin = insertUser.run('Admin User', 'admin@example.com', password, 'admin');
const analyst = insertUser.run('Analyst User', 'analyst@example.com', password, 'analyst');
const viewer = insertUser.run('Viewer User', 'viewer@example.com', password, 'viewer');

// Create financial records
const insertRecord = db.prepare(`
  INSERT INTO financial_records (user_id, amount, type, category, date, notes)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const records = [
  [admin.lastInsertRowid, 5000, 'income', 'Salary', '2024-01-05', 'Monthly salary January'],
  [admin.lastInsertRowid, 1200, 'expense', 'Rent', '2024-01-07', 'January rent'],
  [admin.lastInsertRowid, 350, 'expense', 'Groceries', '2024-01-10', null],
  [admin.lastInsertRowid, 5000, 'income', 'Salary', '2024-02-05', 'Monthly salary February'],
  [admin.lastInsertRowid, 1200, 'expense', 'Rent', '2024-02-07', 'February rent'],
  [admin.lastInsertRowid, 800, 'income', 'Freelance', '2024-02-15', 'Website project'],
  [admin.lastInsertRowid, 200, 'expense', 'Utilities', '2024-02-20', 'Electric bill'],
  [admin.lastInsertRowid, 5000, 'income', 'Salary', '2024-03-05', 'Monthly salary March'],
  [admin.lastInsertRowid, 1200, 'expense', 'Rent', '2024-03-07', 'March rent'],
  [admin.lastInsertRowid, 450, 'expense', 'Entertainment', '2024-03-12', 'Subscriptions'],
  [admin.lastInsertRowid, 1500, 'income', 'Freelance', '2024-03-20', 'Mobile app project'],
  [admin.lastInsertRowid, 300, 'expense', 'Groceries', '2024-03-25', null],
  [analyst.lastInsertRowid, 4500, 'income', 'Salary', '2024-01-05', 'January salary'],
  [analyst.lastInsertRowid, 900, 'expense', 'Rent', '2024-01-08', null],
  [analyst.lastInsertRowid, 4500, 'income', 'Salary', '2024-02-05', 'February salary'],
  [analyst.lastInsertRowid, 600, 'expense', 'Transport', '2024-02-18', 'Monthly pass'],
];

for (const r of records) insertRecord.run(...r);

console.log('✅ Seeded successfully!');
console.log('\nDemo accounts:');
console.log('  admin@example.com    / password123  (admin)');
console.log('  analyst@example.com  / password123  (analyst)');
console.log('  viewer@example.com   / password123  (viewer)');
