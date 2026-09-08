import { Router } from 'express';
import { getVisitors, createVisitorRequest, updateVisitStatus, checkVisitor, createVisitor, getVisitorInvitations } from '../controllers/visitor.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getVisitors);
router.post('/check', checkVisitor);
router.post('/profile', createVisitor);
router.post('/', createVisitorRequest);
router.patch('/:id/status', updateVisitStatus);
router.get('/my-invitations', authenticate, getVisitorInvitations);

export default router;
