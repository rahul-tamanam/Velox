const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

router.post('/register', (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE lower(trim(email)) = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const info = db
      .prepare(
        `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`
      )
      .run(name, email, hash);

    const newId = Number(info.lastInsertRowid);
    const token = jwt.sign(
      { id: newId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: newId, name, email } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = db.prepare('SELECT * FROM users WHERE lower(trim(email)) = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const userId = Number(user.id);
    const token = jwt.sign({ id: userId, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json({
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        risk_profile: user.risk_profile,
        goal_name: user.goal_name,
        goal_target_amount: user.goal_target_amount,
        goal_target_year: user.goal_target_year,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/profile', authMiddleware, (req, res) => {
  try {
    const { risk_profile, goal_name, goal_target_amount, goal_target_year, name } = req.body;
    const fields = [];
    const vals = [];
    if (risk_profile !== undefined) {
      fields.push('risk_profile = ?');
      vals.push(risk_profile);
    }
    if (goal_name !== undefined) {
      fields.push('goal_name = ?');
      vals.push(goal_name);
    }
    if (goal_target_amount !== undefined) {
      fields.push('goal_target_amount = ?');
      vals.push(goal_target_amount);
    }
    if (goal_target_year !== undefined) {
      fields.push('goal_target_year = ?');
      vals.push(goal_target_year);
    }
    if (name !== undefined) {
      fields.push('name = ?');
      vals.push(name);
    }
    if (!fields.length) return res.status(400).json({ error: 'No updates' });
    vals.push(req.user.id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    const user = db.prepare('SELECT id,name,email,risk_profile,goal_name,goal_target_amount,goal_target_year FROM users WHERE id = ?').get(
      req.user.id
    );
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
