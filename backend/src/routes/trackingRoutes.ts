import { Router } from 'express';
import { getTracking } from '../controllers/batchController';
import { verifyToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.get('/:batchId', verifyToken, authorizeRoles('institution', 'recycler', 'ngo', 'admin'), getTracking);

export default router;
