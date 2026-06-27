import { Router } from 'express';
import { createBlog, listBlogs } from '../controllers/blog.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/', listBlogs);
router.post('/', authenticate, authorizeRoles('ADMIN'), createBlog);

export default router;
