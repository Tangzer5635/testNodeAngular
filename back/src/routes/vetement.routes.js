import express from 'express';
import * as vetementsController from '../controllers/vetement.controller.js';

const router = express.Router();

router.get('/', vetementsController.getAll);
router.get('/:id', vetementsController.getById);
router.post('/', vetementsController.create);
router.put('/:id', vetementsController.update);
router.delete('/:id', vetementsController.remove);

export default router;