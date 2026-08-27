import { Router } from 'express';
import { Role } from '@prisma/client';
import { getDashboard, getEmployees } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authenticate, requireRole(Role.SUPER_ADMIN), getDashboard);
router.get('/employees', authenticate, requireRole(Role.SUPER_ADMIN), getEmployees);

export default router;
