import { Router } from 'express';
import { Role } from '@prisma/client';
import { getDashboard } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authenticate, requireRole(Role.SUPER_ADMIN), getDashboard);

export default router;
