import { Router } from 'express';
import {
  createIdea,
  deleteIdea,
  getIdeaBySlug,
  getUserIdeas,
  listIdeas,
  reviewIdea,
  submitIdea,
  updateIdea,
} from '../controllers/idea.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { optionalAuth } from '../middlewares/optionalAuth';
import { validate } from '../middlewares/validate';
import { ideaCreateSchema, ideaUpdateSchema } from '../validators/idea.validation';

const router = Router();

router.get('/', optionalAuth, listIdeas);
router.get('/user', authenticate, getUserIdeas);
router.get('/:slug', optionalAuth, getIdeaBySlug);
router.post('/', authenticate, validate(ideaCreateSchema), createIdea);
router.patch('/:id', authenticate, validate(ideaUpdateSchema), updateIdea);
router.delete('/:id', authenticate, deleteIdea);
router.patch('/:id/submit', authenticate, submitIdea);
router.patch('/:id/review', authenticate, authorizeRoles('ADMIN'), reviewIdea);

export default router;
