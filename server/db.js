const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

const rawPath = process.env.DB_PATH || path.join(__dirname, 'velox.db');
const dbPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);

const db = new DatabaseSync(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  risk_profile TEXT DEFAULT 'moderate',
  goal_name TEXT DEFAULT 'Retirement',
  goal_target_amount REAL DEFAULT 1000000,
  goal_target_year INTEGER DEFAULT 2045,
  onboarding_answers TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ticker TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity REAL NOT NULL,
  avg_buy_price REAL NOT NULL,
  buy_date TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ticker TEXT NOT NULL,
  action TEXT NOT NULL,
  quantity REAL NOT NULL,
  price REAL NOT NULL,
  date TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

try {
  db.exec("ALTER TABLE users ADD COLUMN onboarding_answers TEXT DEFAULT '[]';");
} catch {
  /* column already exists */
}

const DEMO_EMAIL = 'demo@velox.com';
const DEMO_PASSWORD = 'demo1234';

function seedDemoHoldings(userId) {
  const holdings = [
    ['AAPL', 'stock', 10, 150, '2023-01-15'],
    ['MSFT', 'stock', 5, 280, '2023-02-01'],
    ['QQQ', 'fund', 3, 340, '2023-03-10'],
    ['GLD', 'fund', 8, 175, '2023-04-20'],
    ['VNQ', 'fund', 12, 85, '2023-05-05'],
  ];
  const ins = db.prepare(
    `INSERT INTO holdings (user_id, ticker, type, quantity, avg_buy_price, buy_date) VALUES (?,?,?,?,?,?)`
  );
  for (const [ticker, type, qty, price, buyDate] of holdings) {
    ins.run(userId, ticker, type, qty, price, buyDate);
  }
}

/** Ensures demo account always exists with password demo1234 (fixes skip-seed when DB had other users). */
function ensureDemoAccount() {
  try {
    db.prepare('UPDATE users SET email = ? WHERE lower(trim(email)) = lower(?)').run(
      DEMO_EMAIL,
      'demo@vestiq.com'
    );
  } catch {
    /* ignore */
  }
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const existing = db.prepare('SELECT id FROM users WHERE lower(trim(email)) = lower(?)').get(DEMO_EMAIL);

  let uid;
  if (!existing) {
    const info = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, risk_profile, goal_name, goal_target_amount, goal_target_year)
         VALUES (?, ?, ?, 'moderate', 'Retirement', 1000000, 2045)`
      )
      .run('Demo Investor', DEMO_EMAIL, hash);
    uid = Number(info.lastInsertRowid);
    seedDemoHoldings(uid);
    return;
  }

  uid = Number(existing.id);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, uid);

  const { c } = db.prepare('SELECT COUNT(*) AS c FROM holdings WHERE user_id = ?').get(uid);
  if (c === 0) {
    seedDemoHoldings(uid);
  }
}

ensureDemoAccount();

module.exports = db;
