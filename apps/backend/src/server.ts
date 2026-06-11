import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { runMigrations } from './db';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import gymsRouter from './routes/gyms';
import usersRouter from './routes/users';
import plansRouter from './routes/plans';
import membersRouter from './routes/members';
import dashboardRouter from './routes/dashboard';
import paymentsRouter from './routes/payments';
import leadsRouter from './routes/leads';
import websiteRouter from './routes/website';
import publicRouter from './routes/public';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser() as any);

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/gyms', gymsRouter);
app.use('/api/users', usersRouter);
app.use('/api/plans', plansRouter);
app.use('/api/members', membersRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/website-settings', websiteRouter);
app.use('/api/public', publicRouter);

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL is not set');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not set');
    process.exit(1);
  }

  await runMigrations();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();