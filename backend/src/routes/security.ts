import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware';
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
router.post('/scan', scanQrCode);
router.post('/checkin', checkInVisitor);
router.post('/checkout', checkOutVisitor);

// Management endpoints (Only Super Admin)
router.use(authenticate, requireRole(Role.SUPER_ADMIN));
router.get('/guards', getSecurityGuards);
router.post('/guards', createSecurityGuard);
router.patch('/guards/:id', updateSecurityGuard);
router.patch('/guards/:id/deactivate', deactivateSecurityGuard);

export default router;
