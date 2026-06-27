import { Router } from 'express';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import ideaRoutes from './idea.routes';
import commentRoutes from './comment.routes';
import voteRoutes from './vote.routes';
import paymentRoutes from './payment.routes';
import newsletterRoutes from './newsletter.routes';
import adminRoutes from './admin.routes';
import userRoutes from './user.routes';
import blogRoutes from './blog.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/ideas', ideaRoutes);
router.use('/ideas/:ideaId/comments', commentRoutes);
router.use('/ideas/:ideaId/votes', voteRoutes);
router.use('/payments', paymentRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/blogs', blogRoutes);

export default router;
