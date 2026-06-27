import { Router } from 'express';
import { dashboardStats, listUsers, updateUser } from '../controllers/admin.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/stats', authenticate, authorizeRoles('ADMIN'), dashboardStats);
router.get('/users', authenticate, authorizeRoles('ADMIN'), listUsers);
router.patch('/users/:id', authenticate, authorizeRoles('ADMIN'), updateUser);

export default router;
