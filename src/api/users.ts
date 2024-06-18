import express from 'express';
import { UserController } from '../controllers/users.controller';

const router = express.Router();
const userController = new UserController();

// TODO: Terminar el CRUD -> CREATE - READ - UPDATE - DELETE

router.get('/:id', userController.getUser);

export default router;