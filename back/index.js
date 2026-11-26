import app from './src/app.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET manquant : ajoute-le dans back/.env (voir .env.example)');
  process.exit(1);
}

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
