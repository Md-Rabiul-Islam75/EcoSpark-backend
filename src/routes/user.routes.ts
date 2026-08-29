import { Router } from 'express';
import { getProfile, getStats, updateProfile } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.get('/stats', authenticate, getStats);
router.patch('/profile', authenticate, updateProfile);

export default router;
