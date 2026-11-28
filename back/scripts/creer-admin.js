import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';

const [, , email, motDePasse] = process.argv;

if (!email || !motDePasse) {
  console.error('Utilisation : npm run creer-admin -- <email> <mot de passe>');
  process.exit(1);
}

const adresse = email.trim().toLowerCase();
const motDePasseHash = await bcrypt.hash(motDePasse, 10);

await prisma.utilisateur.upsert({
  where: { email: adresse },
  create: { email: adresse, nom: 'Administrateur', motDePasseHash, role: 'admin' },
  update: { motDePasseHash, role: 'admin' },
});

console.log(`Administrateur enregistré : ${email}`);
await prisma.$disconnect();
