import { Router } from 'express';
import { logMobileActivity } from '../controllers/activity.controller';

const router = Router();

router.post('/', logMobileActivity);

export default router;
