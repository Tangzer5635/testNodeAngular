import express from 'express';
import * as vetementsController from '../controllers/vetement.controller.js';
import { admin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', vetementsController.getAll);
router.get('/:id', vetementsController.getById);

router.post('/', admin, vetementsController.create);
router.put('/:id', admin, vetementsController.update);
router.delete('/:id', admin, vetementsController.remove);

export default router;
