import { Router } from 'express';
import { approveUser, blockUser, getProfile, listUsers, upsertProfile } from '../controllers/userController';
import { verifyToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(verifyToken);

router.post('/profile', authorizeRoles('institution', 'recycler', 'ngo', 'admin'), upsertProfile);
router.get('/profile/:uid', authorizeRoles('institution', 'recycler', 'ngo', 'admin'), getProfile);
router.get('/', authorizeRoles('admin'), listUsers);
router.post('/:id/approve', authorizeRoles('admin'), approveUser);
router.post('/:id/block', authorizeRoles('admin'), blockUser);

export default router;
