import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { limiteConnexion, limiteInscription } from '../middlewares/limiteConnexion.js';

const router = express.Router();

router.post('/login', limiteConnexion, authController.login);
router.post('/inscription', limiteInscription, authController.inscription);

export default router;
