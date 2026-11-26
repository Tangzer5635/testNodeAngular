import express from 'express';
import * as commandeController from '../controllers/commande.controller.js';
import { verifierToken } from '../middlewares/auth.js';
import { limiteCommandes } from '../middlewares/limiteCommandes.js';

const router = express.Router();

// Public : un visiteur passe commande
router.post('/', limiteCommandes, commandeController.passer);

// Admin : liste des commandes (option ?statut=en_attente) et changement de statut
router.get('/', verifierToken, commandeController.getAll);
router.patch('/:id', verifierToken, commandeController.changerStatut);

export default router;
