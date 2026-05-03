import { Router } from 'express';
import { getTracking } from '../controllers/batchController';

const router = Router();

router.get('/:batchId', getTracking);

export default router;
