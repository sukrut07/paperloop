import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import batchRoutes from './routes/batchRoutes';
import roomRoutes from './routes/roomRoutes';
import trackingRoutes from './routes/trackingRoutes';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import { firebaseAuth } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '15mb' }));
app.use(firebaseAuth);

app.use('/auth', authRoutes);
app.use('/batch', batchRoutes);
app.use('/room', roomRoutes);
app.use('/tracking', trackingRoutes);
app.use('/users', userRoutes);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'paperloop-api',
    workflow: 'web-native',
  });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/paperloop';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
