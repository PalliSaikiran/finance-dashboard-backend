require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', require('./src/routes/auth'));
app.use('/records', require('./src/routes/records'));
app.use('/dashboard', require('./src/routes/dashboard'));
app.use('/users', require('./src/routes/users'));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Finance Backend is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});
// Auto-seed if DB is empty
const db = require('./src/config/db');
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  console.log('Seeding demo data...');
  require('./src/config/seed');
}
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Finance Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`\n   Run 'npm run seed' to populate demo data\n`);
});
