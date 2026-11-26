import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { limiteConnexion } from '../middlewares/limiteConnexion.js';

const router = express.Router();

router.post('/login', limiteConnexion, authController.login);

export default router;
