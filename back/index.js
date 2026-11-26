import express from 'express';
import cors from 'cors';
import vetementRoutes from './src/routes/vetement.routes.js';
import categorieRoutes from './src/routes/categorie.routes.js';

const app = express();
const origin = 'http://localhost:4200';
app.use(cors({ origin }));
const PORT = process.env.PORT;

app.get('/', (req, res) => {
  res.send('API boutique opérationnelle');
});

app.use('/api/vetements', vetementRoutes);
app.use('/api/categories', categorieRoutes);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});     
