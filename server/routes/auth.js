const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function parseOnboardingAnswers(raw) {
  if (raw == null || raw === '') return [];
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function userRowToClient(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    risk_profile: row.risk_profile,
    goal_name: row.goal_name,
    goal_target_amount: row.goal_target_amount,
    goal_target_year: row.goal_target_year,
    onboarding_answers: parseOnboardingAnswers(row.onboarding_answers),
  };
}

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
    res.json({
      token,
      user: { id: newId, name, email, onboarding_answers: [] },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  try {
    const row = db
      .prepare(
        'SELECT id,name,email,risk_profile,goal_name,goal_target_amount,goal_target_year,onboarding_answers FROM users WHERE id = ?'
      )
      .get(req.user.id);
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userRowToClient(row) });
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
      user: userRowToClient(user),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/profile', authMiddleware, (req, res) => {
  try {
    const { risk_profile, goal_name, goal_target_amount, goal_target_year, name, onboarding_answers } = req.body;
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
    if (onboarding_answers !== undefined) {
      fields.push('onboarding_answers = ?');
      const stored =
        typeof onboarding_answers === 'string' ? onboarding_answers : JSON.stringify(onboarding_answers);
      vals.push(stored);
    }
    if (!fields.length) return res.status(400).json({ error: 'No updates' });
    vals.push(req.user.id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    const row = db
      .prepare(
        'SELECT id,name,email,risk_profile,goal_name,goal_target_amount,goal_target_year,onboarding_answers FROM users WHERE id = ?'
      )
      .get(req.user.id);
    res.json({ user: userRowToClient(row) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/account', authMiddleware, (req, res) => {
  try {
    const uid = req.user.id;
    db.prepare('DELETE FROM holdings WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM transactions WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM users WHERE id = ?').run(uid);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/password', authMiddleware, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!row || !bcrypt.compareSync(current_password, row.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
