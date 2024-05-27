import express from 'express';
import { UserController } from '../controllers/users.controller';
import { UserServices } from '../services/users.services';

const router = express.Router();
const userController = new UserController(new UserServices());

router.get('/:id', userController.getUser);

export default router;