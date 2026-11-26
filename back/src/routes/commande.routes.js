import express from 'express';
import * as commandeController from '../controllers/commande.controller.js';
import { admin, tokenOptionnel, verifierToken } from '../middlewares/auth.js';
import { limiteCommandes } from '../middlewares/limiteCommandes.js';

const router = express.Router();

router.post('/', limiteCommandes, tokenOptionnel, commandeController.passer);
router.get('/miennes', verifierToken, commandeController.getMiennes);

router.get('/', admin, commandeController.getAll);
router.get('/compteurs', admin, commandeController.getCompteurs);
router.patch('/:id', admin, commandeController.changerStatut);

export default router;
