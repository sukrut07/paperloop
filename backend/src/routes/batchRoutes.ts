import { Router } from 'express';
import { createBatch, getBatch, updateBatchStatus, getTracking } from '../controllers/batchController';

const router = Router();

router.post('/create', createBatch);
router.get('/:id', getBatch);
router.post('/update-status', updateBatchStatus);
router.get('/tracking/:batchId', getTracking);

export default router;
