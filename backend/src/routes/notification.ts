import { Router } from 'express';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, registerDevice, unregisterDevice, testAdminPush } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.post('/register-device', registerDevice);
router.post('/unregister-device', unregisterDevice);
router.post('/test-admin-push', testAdminPush);

export default router;
