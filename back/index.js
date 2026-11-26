import express from 'express';
import cors from 'cors';
import path from 'node:path';
import vetementRoutes from './src/routes/vetement.routes.js';
import categorieRoutes from './src/routes/categorie.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import { routeIntrouvable, gestionnaireErreurs } from './src/middlewares/erreurs.js';

const app = express();
const PORT = process.env.PORT;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:4200';

app.disable('x-powered-by');

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use('/images', express.static(path.join(import.meta.dirname, 'public', 'images')));

app.get('/', (req, res) => {
  res.send('API boutique opérationnelle');
});

app.use('/api/vetements', vetementRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/auth', authRoutes);

app.use(routeIntrouvable);
app.use(gestionnaireErreurs);


app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
