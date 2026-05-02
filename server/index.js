require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).length < 8) {
  console.error(
    '[velox] Set JWT_SECRET in .env (any long random string). Login will fail until this is set.'
  );
  process.exit(1);
}

require('./db');

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const stocksRoutes = require('./routes/stocks');
const simulateRoutes = require('./routes/simulate');
const chatbotRoutes = require('./routes/chatbot');
const macroRoutes = require('./routes/macro');
const newsRoutes = require('./routes/news');
const toolsRoutes = require('./routes/tools');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/macro', macroRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/tools', toolsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'velox-api' });
});

app.listen(PORT, () => {
  console.log(`Velox API listening on http://localhost:${PORT}`);
});
