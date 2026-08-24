import { Router } from 'express';
import { scanQrCode, checkInVisitor, checkOutVisitor } from '../controllers/security.controller';

const router = Router();

router.post('/scan', scanQrCode);
router.post('/checkin', checkInVisitor);
router.post('/checkout', checkOutVisitor);

export default router;
