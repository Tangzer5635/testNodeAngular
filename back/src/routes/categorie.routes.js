import express from 'express'
import * as categorieController from "../controllers/categorie.controller.js";

const router = express.Router();

router.get('/', categorieController.getAll);

export default router;