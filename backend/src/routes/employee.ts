// Force TS compiler refresh
import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  createEmployee,
  createEmployeeInvitation,
  getEmployeeDashboard,
  getEmployees,
  getEmployeeById,
  getEmployeeVisits,
  updateEmployee,
  deactivateEmployee
} from '../controllers/employee.controller';

const router = Router();

const requireEmployeeSelf = (req: any, res: any, next: any) => {
  if (req.user?.role !== Role.EMPLOYEE) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
};

router.get('/dashboard', authenticate, requireEmployeeSelf, getEmployeeDashboard);
router.get('/visits', authenticate, requireEmployeeSelf, getEmployeeVisits);
router.post('/invitations', authenticate, requireEmployeeSelf, createEmployeeInvitation);

// Only Super Admin can manage employees
router.use(authenticate, requireRole(Role.SUPER_ADMIN));

router.get('/', getEmployees);
router.post('/', createEmployee);
router.get('/:id', getEmployeeById);
router.patch('/:id', updateEmployee);
router.patch('/:id/deactivate', deactivateEmployee);

export default router;
