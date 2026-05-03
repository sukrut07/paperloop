import { Router } from 'express';
import { createRoom, getRoom, joinRoom } from '../controllers/roomController';

const router = Router();

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/:code', getRoom);

export default router;
