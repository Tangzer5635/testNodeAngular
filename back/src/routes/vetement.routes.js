import express from 'express';
import * as vetementsController from '../controllers/vetement.controller.js';

const router = express.Router();

router.get('/', vetementsController.getAll);

router.get('/:id', vetementsController.getById);

export default router;