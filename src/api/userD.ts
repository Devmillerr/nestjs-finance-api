
import express from 'express';
import { DetuserController } from '../controllers/userD.controller';

const router = express.Router();
const detuserController = new detuserController();

router.get('/:id', detuserController.getUserD);

export default router;