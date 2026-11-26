import express from 'express';
import { verifierToken } from '../middlewares/auth.js';
import { uploadImage } from '../middlewares/upload.js';
import * as imageController from '../controllers/image.controller.js';

const router = express.Router();

router.post('/', verifierToken, uploadImage, imageController.envoyer);

export default router;