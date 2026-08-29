import { Router } from 'express';
import {
	approveIdea,
	dashboardStats,
	featureIdea,
	listIdeas,
	listUsers,
	rejectIdea,
	updateUser,
} from '../controllers/admin.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/stats', authenticate, authorizeRoles('ADMIN'), dashboardStats);
router.get('/users', authenticate, authorizeRoles('ADMIN'), listUsers);
router.patch('/users/:id', authenticate, authorizeRoles('ADMIN'), updateUser);
router.get('/ideas', authenticate, authorizeRoles('ADMIN'), listIdeas);
router.post('/ideas/:id/approve', authenticate, authorizeRoles('ADMIN'), approveIdea);
router.post('/ideas/:id/reject', authenticate, authorizeRoles('ADMIN'), rejectIdea);
router.post('/ideas/:id/feature', authenticate, authorizeRoles('ADMIN'), featureIdea);

export default router;
