import express from 'express';
import { UserController } from '../controllers/users.controller';

const router = express.Router();
const userController = new UserController();

router.get('/:id', userController.getUser);

export default router;