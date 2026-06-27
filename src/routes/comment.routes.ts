import { Router } from 'express';
import { createComment, deleteComment, listComments, updateComment } from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { commentCreateSchema } from '../validators/comment.validation';

const router = Router({ mergeParams: true });

router.get('/', listComments);
router.post('/', authenticate, validate(commentCreateSchema), createComment);
router.patch('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);

export default router;
