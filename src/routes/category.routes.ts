import { Router } from 'express';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/category.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { categorySchema } from '../validators/category.validation';

const router = Router();

router.get('/', listCategories);
router.post('/', authenticate, authorizeRoles('ADMIN'), validate(categorySchema), createCategory);
router.patch('/:id', authenticate, authorizeRoles('ADMIN'), validate(categorySchema), updateCategory);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), deleteCategory);

export default router;
