import { Router } from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import { getConnect, getDisconnect } from '../controllers/AuthCont
roller';
import { getMe } from '../controllers/UserController';

const router = Router();

router.get('/status', getStatus);
router.get('/stats', getStats);
router.get('/connect', getConnect);
router.get('/disconnect', getDisconnect);
router.get('/users/me', getMe);

export default router;
