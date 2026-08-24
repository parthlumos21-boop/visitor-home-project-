import { Router } from 'express';
import { getVisitors, createVisitorRequest, updateVisitStatus } from '../controllers/visitor.controller';

const router = Router();

router.get('/', getVisitors);
router.post('/', createVisitorRequest);
router.patch('/:id/status', updateVisitStatus);

export default router;
