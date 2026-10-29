const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'Blog API is running' }));

app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Image must be 5 MB or smaller.' });
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blog_application')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    console.error('Check that MongoDB is running and MONGO_URI in server/.env is correct.');
    process.exit(1);
  });
