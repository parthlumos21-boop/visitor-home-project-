import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const app: Express = express();
const port = Number(process.env.PORT || 5001);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
export const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error']
});

import authRoutes from './routes/auth';
import visitorRoutes from './routes/visitor';
import securityRoutes from './routes/security';
import adminRoutes from './routes/admin';
import activityRoutes from './routes/activity';
import appointmentRoutes from './routes/appointment';
import notificationRoutes from './routes/notification';
import employeeRoutes from './routes/employee';

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
app.use('/api/admin', adminRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/new-appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/employees', employeeRoutes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Visitor Gate API is running!');
});

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

// Setup HTTP server and Socket.io
const server = http.createServer(app);
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    socket.data.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.data.user?.id}`);
  
  // Join a room specific to the user's ID
  if (socket.data.user?.id) {
    socket.join(socket.data.user.id);
  }

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.data.user?.id}`);
  });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
});
