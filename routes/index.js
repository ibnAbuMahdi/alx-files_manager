import { Router } from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import { getConnect, getDisconnect } from '../controllers/AuthController';
<<<<<<< HEAD
import { getShow, getIndex, postUpload } from '../controllers/FilesController';
import { getMe, postNew } from '../controllers/UsersController';
=======
import { getShow, getIndex, getFile } from '../controllers/FilesController';
import { getMe } from '../controllers/UserController';
>>>>>>> task_8

const router = Router();

router.get('/status', getStatus);
router.get('/stats', getStats);
router.get('/connect', getConnect);
router.get('/disconnect', getDisconnect);
router.get('/users/me', getMe);
router.get('/files/:id', getShow);
router.get('/files', getIndex);
<<<<<<< HEAD
router.post('/users', postNew);
router.post('/files', postUpload);

=======
router.get('/files:id/data', getFile);
>>>>>>> task_8
export default router;
