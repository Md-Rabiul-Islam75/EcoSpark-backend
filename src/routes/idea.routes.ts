import { Router } from 'express';
import {
  createIdea,
  deleteIdea,
  getIdeaBySlug,
  getUserIdeas,
  listIdeas,
  reviewIdea,
  submitIdea,
  uploadIdeaImage,
  uploadIdeaImageFromUrl,
  updateIdea,
} from '../controllers/idea.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { optionalAuth } from '../middlewares/optionalAuth';
import { validate } from '../middlewares/validate';
import { ideaCreateSchema, ideaUpdateSchema } from '../validators/idea.validation';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith('image/'));
  },
});

router.get('/', optionalAuth, listIdeas);
router.get('/user', authenticate, getUserIdeas);
router.post('/upload', authenticate, upload.single('image'), uploadIdeaImage);
router.post('/upload-url', authenticate, uploadIdeaImageFromUrl);
router.get('/:slug', optionalAuth, getIdeaBySlug);
router.post('/', authenticate, validate(ideaCreateSchema), createIdea);
router.patch('/:id', authenticate, validate(ideaUpdateSchema), updateIdea);
router.delete('/:id', authenticate, deleteIdea);
router.patch('/:id/submit', authenticate, submitIdea);
router.patch('/:id/review', authenticate, authorizeRoles('ADMIN'), reviewIdea);

export default router;
