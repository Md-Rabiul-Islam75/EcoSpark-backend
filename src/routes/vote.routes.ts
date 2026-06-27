import { Router } from 'express';
import { castVote } from '../controllers/vote.controller';
import { authenticate } from '../middlewares/auth';

const router = Router({ mergeParams: true });

router.post('/', authenticate, castVote);

export default router;
