import express from 'express';
import * as vetementsController from '../controllers/vetement.controller.js';
import { verifierToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', vetementsController.getAll);
router.get('/:id', vetementsController.getById);

router.post('/', verifierToken, vetementsController.create);
router.put('/:id', verifierToken, vetementsController.update);
router.delete('/:id', verifierToken, vetementsController.remove);

export default router;