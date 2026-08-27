import { Router } from 'express';
import { getVisitors, createVisitorRequest, updateVisitStatus, checkVisitor, createVisitor } from '../controllers/visitor.controller';

const router = Router();

router.get('/', getVisitors);
router.post('/check', checkVisitor);
router.post('/profile', createVisitor);
router.post('/', createVisitorRequest);
router.patch('/:id/status', updateVisitStatus);

export default router;
