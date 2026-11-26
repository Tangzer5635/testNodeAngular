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

// L'application est créée ici, SANS app.listen() : les tests peuvent ainsi la démarrer eux-mêmes.
const app = express();

app.disable('x-powered-by');
// Derrière nginx (Docker), l'adresse du visiteur est dans X-Forwarded-For.
// On ne fait confiance à cet en-tête que s'il vient de la machine ou du réseau Docker.
app.set('trust proxy', 'loopback, uniquelocal');

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200' }));
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
