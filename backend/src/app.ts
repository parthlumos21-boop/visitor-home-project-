import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5001;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
export const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error']
});

import authRoutes from './routes/auth';
import visitorRoutes from './routes/visitor';
import securityRoutes from './routes/security';

// Middleware
app.use(cors());
app.use(express.json());

// API Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[API Request] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/security', securityRoutes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Visitor Gate API is running!');
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
