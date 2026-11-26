import express from 'express';
import * as commandeController from '../controllers/commande.controller.js';
import { verifierToken } from '../middlewares/auth.js';
import { limiteCommandes } from '../middlewares/limiteCommandes.js';

const router = express.Router();

router.post('/', limiteCommandes, commandeController.passer);

router.get('/', verifierToken, commandeController.getAll);
router.patch('/:id', verifierToken, commandeController.changerStatut);

export default router;
