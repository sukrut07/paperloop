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
  receiveBatch,
  recycleBatch,
  seedDemoData,
  transitBatch,
  uploadProofAsset,
} from '../controllers/batchController';
import { verifyToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(verifyToken);

router.get('/', authorizeRoles('institution', 'recycler', 'ngo', 'admin'), listBatches);
router.get('/available', authorizeRoles('recycler', 'admin'), getAvailableBatches);
router.get('/recycled', authorizeRoles('ngo', 'admin'), getRecycledBatches);
router.get('/analytics/summary', authorizeRoles('admin'), getAnalytics);
router.post('/proof-upload', authorizeRoles('institution', 'recycler', 'ngo', 'admin'), uploadProofAsset);
router.post('/create', authorizeRoles('institution'), createBatch);
router.post('/proof', authorizeRoles('institution'), addProofUpdate);
router.post('/accept', authorizeRoles('recycler'), acceptBatch);
router.post('/pickup', authorizeRoles('recycler'), pickupBatch);
router.post('/transit', authorizeRoles('recycler'), transitBatch);
router.post('/receive', authorizeRoles('recycler'), receiveBatch);
router.post('/recycle', authorizeRoles('recycler'), recycleBatch);
router.post('/distribute', authorizeRoles('ngo'), distributeBatch);
router.post('/seed-demo', authorizeRoles('admin'), seedDemoData);
router.get('/:id', authorizeRoles('institution', 'recycler', 'ngo', 'admin'), getBatch);

export default router;
