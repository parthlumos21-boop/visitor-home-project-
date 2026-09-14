import { Router } from 'express';
import { getVisitors, createVisitorRequest, updateVisitStatus, checkVisitor, createVisitor, getMyVisitorVisits, getVisitorHosts } from '../controllers/visitor.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getVisitors);
router.post('/check', checkVisitor);
router.post('/profile', createVisitor);
router.get('/hosts', authenticate, getVisitorHosts);
router.get('/my-visits', authenticate, getMyVisitorVisits);
router.post('/', createVisitorRequest);
router.patch('/:id/status', updateVisitStatus);

export default router;
