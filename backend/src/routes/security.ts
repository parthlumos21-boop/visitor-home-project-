import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireAnyRole, requireRole } from '../middleware/auth.middleware';
import { 
  scanQrCode, 
  checkInVisitor, 
  checkOutVisitor,
  getSecurityGuards,
  createSecurityGuard,
  updateSecurityGuard,
  deactivateSecurityGuard,
  getSecurityDashboardStats,
  getSecurityVisits
} from '../controllers/security.controller';

const router = Router();

// Protected dashboard and listing routes for SECURITY/ADMIN
router.get('/dashboard', authenticate, getSecurityDashboardStats);
router.get('/visits', authenticate, getSecurityVisits);

// Scanning endpoints
router.post('/scan', authenticate, requireAnyRole(Role.SECURITY, Role.SUPER_ADMIN), scanQrCode);
router.post('/checkin', authenticate, requireAnyRole(Role.SECURITY, Role.SUPER_ADMIN), checkInVisitor);
router.post('/checkout', authenticate, requireAnyRole(Role.SECURITY, Role.SUPER_ADMIN), checkOutVisitor);

// Management endpoints (Only Super Admin)
router.use(authenticate, requireRole(Role.SUPER_ADMIN));
router.get('/guards', getSecurityGuards);
router.post('/guards', createSecurityGuard);
router.patch('/guards/:id', updateSecurityGuard);
router.patch('/guards/:id/deactivate', deactivateSecurityGuard);

export default router;
