// Force TS compiler refresh
import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deactivateEmployee
} from '../controllers/employee.controller';

const router = Router();

// Only Super Admin can manage employees
router.use(authenticate, requireRole(Role.SUPER_ADMIN));

router.get('/', getEmployees);
router.post('/', createEmployee);
router.get('/:id', getEmployeeById);
router.patch('/:id', updateEmployee);
router.patch('/:id/deactivate', deactivateEmployee);

export default router;
