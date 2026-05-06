import { Router } from 'express';
import { firebaseLogin, login, markEmailVerified, me, signup } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/firebase', firebaseLogin);
router.get('/me', verifyToken, me);
router.post('/verify-email', verifyToken, markEmailVerified);

export default router;
