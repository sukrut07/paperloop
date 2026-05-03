import { Router } from 'express';
import { getProfile, upsertProfile } from '../controllers/userController';

const router = Router();

router.post('/profile', upsertProfile);
router.get('/profile/:uid', getProfile);

export default router;
