import { Router } from 'express';
import { subscribeNewsletter } from '../controllers/newsletter.controller';
import { optionalAuth } from '../middlewares/optionalAuth';
import { validate } from '../middlewares/validate';
import { newsletterSchema } from '../validators/newsletter.validation';

const router = Router();

router.post('/subscribe', optionalAuth, validate(newsletterSchema), subscribeNewsletter);

export default router;
