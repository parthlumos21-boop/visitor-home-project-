import { Router } from 'express';
import {
  approveNewAppointment,
  createNewAppointment,
  getNewAppointments,
  rejectNewAppointment,
} from '../controllers/appointment.controller';

const router = Router();

router.get('/', getNewAppointments);
router.post('/', createNewAppointment);
router.patch('/:id/approve', approveNewAppointment);
router.patch('/:id/reject', rejectNewAppointment);

export default router;
