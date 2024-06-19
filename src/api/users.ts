import express from 'express';
import { UserController } from '../controllers/users.controller';

const router = express.Router();
const userController = new UserController();

// TODO: Terminar el CRUD -> CREATE - READ - UPDATE - DELETE

router.get('/u/:id', userController.getAll)
router.use('/p/:id', userController.getOne)
router.post('/', userController.create)
router.put('/', userController.update)
router.delete('/', userController.remove)

export default router;