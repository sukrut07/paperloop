import { Router } from 'express';
import {
  acceptBatch,
  addProofUpdate,
  createBatch,
  distributeBatch,
  getAnalytics,
  getAvailableBatches,
  getBatch,
  getRecycledBatches,
  listBatches,
  pickupBatch,
  prepareBatchIPFS,
  receiveBatch,
  recycleBatch,
  seedDemoData,
  transitBatch,
} from '../controllers/batchController';

const router = Router();

router.get('/', listBatches);
router.get('/available', getAvailableBatches);
router.get('/recycled', getRecycledBatches);
router.get('/analytics/summary', getAnalytics);
router.post('/ipfs', prepareBatchIPFS);
router.post('/create', createBatch);
router.post('/proof', addProofUpdate);
router.post('/accept', acceptBatch);
router.post('/pickup', pickupBatch);
router.post('/transit', transitBatch);
router.post('/receive', receiveBatch);
router.post('/recycle', recycleBatch);
router.post('/distribute', distributeBatch);
router.post('/seed-demo', seedDemoData);
router.get('/:id', getBatch);

export default router;
