import { Router } from 'express';
import {
  addRoomMember,
  addRoomMessage,
  createRoom,
  deleteRoom,
  getRoom,
  joinRoom,
  listRooms,
  selectRecycler,
  updateRoomShipment,
} from '../controllers/roomController';
import { verifyToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(verifyToken);

router.get('/', authorizeRoles('institution', 'recycler', 'ngo', 'admin'), listRooms);
router.post('/create', authorizeRoles('institution'), createRoom);
router.post('/join', authorizeRoles('institution', 'recycler', 'ngo', 'admin'), joinRoom);
router.post('/:code/members', authorizeRoles('institution', 'recycler', 'ngo', 'admin'), addRoomMember);
router.post('/:code/messages', authorizeRoles('institution', 'recycler', 'ngo', 'admin'), addRoomMessage);
router.post('/:code/recycler', authorizeRoles('institution', 'admin'), selectRecycler);
router.post('/:code/shipment', authorizeRoles('institution', 'recycler', 'ngo', 'admin'), updateRoomShipment);
router.get('/:code', authorizeRoles('institution', 'recycler', 'ngo', 'admin'), getRoom);
router.delete('/:code', authorizeRoles('institution', 'admin'), deleteRoom);

export default router;
