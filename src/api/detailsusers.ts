import express from 'express';
import { DetuserController } from '../controllers/detuser.controller';

const router = express.Router();
const detuserController = new DetuserController(); 
router.get('/:id', detuserController.getDetuser);

export default router;

