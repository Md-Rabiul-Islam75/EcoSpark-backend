import { Router } from 'express';
import { createCheckoutSession, myPurchasedIdeas, stripeWebhook } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { checkoutSchema } from '../validators/payment.validation';

const router = Router();

router.post('/checkout', authenticate, validate(checkoutSchema), createCheckoutSession);
router.post('/webhook', stripeWebhook);
router.get('/purchased', authenticate, myPurchasedIdeas);

export default router;
