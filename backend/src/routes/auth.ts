import { Router } from 'express';
import { login, previewLoginUser, register } from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/login
router.post('/login', login);
// GET /api/auth/preview?email=user@example.com
router.get('/preview', previewLoginUser);
// POST /api/auth/register
router.post('/register', register);

export default router;
