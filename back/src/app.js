import express from 'express';
import cors from 'cors';
import path from 'node:path';
import vetementRoutes from './routes/vetement.routes.js';
import categorieRoutes from './routes/categorie.routes.js';
import authRoutes from './routes/auth.routes.js';
import imageRoutes from './routes/image.routes.js';
import commandeRoutes from './routes/commande.routes.js';
import { routeIntrouvable, gestionnaireErreurs } from './middlewares/erreurs.js';
import { DOSSIER_UPLOADS } from './middlewares/upload.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 'loopback, uniquelocal');

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200', exposedHeaders: ['X-Total-Count'] }));
app.use(express.json());
app.use('/images', express.static(path.join(import.meta.dirname, '..', 'public', 'images')));
app.use('/images', express.static(DOSSIER_UPLOADS));

app.get('/', (req, res) => {
  res.send('API boutique opérationnelle');
});

app.use('/api/vetements', vetementRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/commandes', commandeRoutes);

app.use(routeIntrouvable);
app.use(gestionnaireErreurs);

export default app;
