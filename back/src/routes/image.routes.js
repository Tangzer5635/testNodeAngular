import express from 'express';
import { admin } from '../middlewares/auth.js';
import { uploadImage } from '../middlewares/upload.js';
import * as imageController from '../controllers/image.controller.js';

const router = express.Router();

router.post('/', admin, uploadImage, imageController.envoyer);

export default router;
