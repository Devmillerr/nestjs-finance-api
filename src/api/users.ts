import express from 'express';
import { UserController } from '../controllers/users.controller';

const router = express.Router();
const userController = new UserController();


// TODO Rutas para obtener usuarios
router.get("/u/:id", userController.getAll);
router.use('/p/:id', userController.getOne)

// TODO para crear, actualizar y eliminar usuarios
router.post('/', userController.create)
router.put('/:id', userController.update)
router.delete('/:id', userController.remove)

export default router;