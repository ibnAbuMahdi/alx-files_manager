import { Router } from 'express';
import { getStatus, getStats } from '../controllers/AppController';
// import { postNew } from '../controllers/UsersController/'
import postNew from '../controllers/UsersController';

const router = Router();

router.get('/status', getStatus);
router.get('/stats', getStats);
router.post('/users', postNew);
// router.post('/files', postUploads);

export default router;
