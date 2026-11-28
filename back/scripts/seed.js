import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';
import { CATALOGUE, CATEGORIES, DOMAINES, NOMS, PRENOMS, RUES, TAILLES, VILLES } from './donnees.js';

const NB_CLIENTS = 400;
const NB_COMMANDES = 3000;
const JOURS = 365;
const MOT_DE_PASSE_DEMO = 'motdepasse1';

if (!process.argv.includes('--remplacer')) {
  console.error('Ce script REMPLACE le catalogue, les clients et les commandes (les admins sont gardés).');
  console.error('Pour confirmer : npm run seed -- --remplacer');
  process.exit(1);
}

let graine = 20261126;
const hasard = () => {
  graine = (graine + 0x6d2b79f5) | 0;
  let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const entier = (min, max) => min + Math.floor(hasard() * (max - min + 1));
const choisir = (liste) => liste.at(Math.floor(hasard() * liste.length));
const choisirPondere = (liste, poids) => {
  let r = hasard() * poids.reduce((s, p) => s + p, 0);
  for (let i = 0; i < liste.length; i++) {
    r -= poids.at(i);
    if (r <= 0) {
      return liste.at(i);
    }
  }
  return liste.at(-1);
};
const sansAccents = (texte) => texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

const maintenant = Date.now();
const JOUR = 24 * 3600 * 1000;

const poidsJour = Array.from({ length: JOURS }, (_, i) => {
  const age = JOURS - i;
  const date = new Date(maintenant - age * JOUR);
  const croissance = 0.5 + i / JOURS;
  const noel = 1 + 1.4 * Math.exp(-(((date.getMonth() === 11 ? date.getDate() : date.getMonth() === 10 ? date.getDate() - 30 : 99) - 8) ** 2) / 60);
  const soldes = date.getMonth() === 0 && date.getDate() < 25 ? 1.6 : 1;
  const weekend = [0, 6].includes(date.getDay()) ? 1.35 : 1;
  return croissance * noel * soldes * weekend;
});

const dateCommande = () => {
  const jour = choisirPondere([...Array(JOURS).keys()], poidsJour);
  const heure = choisirPondere([8, 10, 12, 13, 18, 20, 21, 22], [1, 2, 3, 2, 3, 4, 4, 2]);
  return new Date(maintenant - (JOURS - jour) * JOUR + heure * 3600 * 1000 + entier(0, 3599) * 1000);
};

const adresse = () => {
  const [cp, ville] = choisir(VILLES);
  return `${entier(1, 120)} ${choisir(RUES)}\n${cp} ${ville}`;
};

const personne = (emailsPris) => {
  const prenom = choisir(PRENOMS);
  const nom = choisir(NOMS);
  let email = `${sansAccents(prenom)}.${sansAccents(nom)}@${choisir(DOMAINES)}`;
  for (let n = 2; emailsPris.has(email); n++) {
    email = `${sansAccents(prenom)}.${sansAccents(nom)}${n}@${choisir(DOMAINES)}`;
  }
  emailsPris.add(email);
  return { nom: `${prenom} ${nom}`, email };
};

const statutSelonAge = (date) => {
  const jours = (maintenant - date.getTime()) / JOUR;
  if (jours > 10) {
    return choisirPondere(['expediee', 'annulee'], [93, 7]);
  }
  if (jours > 3) {
    return choisirPondere(['expediee', 'en_attente', 'annulee'], [70, 25, 5]);
  }
  return choisirPondere(['en_attente', 'annulee'], [95, 5]);
};

const genererCatalogue = () =>
  CATALOGUE.map((v, rang) => ({
    ...v,
    stocks: TAILLES[v.tailles].map((taille, ordre) => ({
      taille,
      ordre: ordre + 1,
      quantite: hasard() < 0.1 ? 0 : hasard() < 0.15 ? entier(1, 3) : entier(4, 40),
    })),
    popularite: 1 / (rang % 13 + 2) + hasard() * 0.2,
  }));

const genererClients = (emailsPris) =>
  Array.from({ length: NB_CLIENTS }, () => ({ ...personne(emailsPris), adresse: adresse(), commandes: 0 }));

const genererCommandes = (catalogue, clients, emailsPris) => {
  const commandes = Array.from({ length: NB_COMMANDES }, () => {
    const date = dateCommande();
    const client = hasard() < 0.65 ? choisir(clients) : null;
    const invite = client ? null : { ...personne(emailsPris), adresse: adresse() };
    const nbLignes = choisirPondere([1, 2, 3, 4], [55, 30, 11, 4]);
    const lignes = new Map();
    for (let i = 0; i < nbLignes; i++) {
      const vetement = choisirPondere(catalogue, catalogue.map(v => v.popularite));
      const taille = choisir(vetement.stocks).taille;
      const cle = `${vetement.nom}|${taille}`;
      const quantite = (lignes.get(cle)?.quantite ?? 0) + (hasard() < 0.85 ? 1 : 2);
      lignes.set(cle, { vetement, taille, quantite });
    }
    if (client) {
      client.commandes++;
      client.premiere = Math.min(client.premiere ?? Infinity, date.getTime());
    }
    return { date, client, invite, statut: statutSelonAge(date), lignes: [...lignes.values()] };
  });
  return commandes.sort((a, b) => a.date - b.date);
};

const enCentimes = (prix) => Math.round(prix * 100);

const inserer = (catalogue, clients, commandes, hash) =>
  prisma.$transaction(async (tx) => {
    await tx.$executeRaw`TRUNCATE lignes_commande, commandes, stocks, vetements, categories RESTART IDENTITY CASCADE`;
    await tx.utilisateur.deleteMany({ where: { role: 'client' } });

    await tx.categorie.createMany({ data: CATEGORIES.map(nom => ({ nom })) });
    const idCategorie = new Map((await tx.categorie.findMany()).map(c => [c.nom, c.id]));

    const vetements = await tx.vetement.createManyAndReturn({
      data: catalogue.map(v => ({
        nom: v.nom,
        description: v.description,
        prix: v.prix,
        image: v.image,
        categorieId: idCategorie.get(v.categorie),
      })),
      select: { id: true, nom: true },
    });
    const idVetement = new Map(vetements.map(v => [v.nom, v.id]));

    await tx.stock.createMany({
      data: catalogue.flatMap(v =>
        v.stocks.map(s => ({ vetementId: idVetement.get(v.nom), taille: s.taille, quantite: s.quantite, ordre: s.ordre }))
      ),
    });

    const utilisateurs = await tx.utilisateur.createManyAndReturn({
      data: clients.map(c => ({
        email: c.email,
        nom: c.nom,
        motDePasseHash: hash,
        role: 'client',
        creeLe: new Date((c.premiere ?? maintenant - entier(1, JOURS) * JOUR) - entier(0, 30) * JOUR),
      })),
      select: { id: true, email: true },
    });
    const idClient = new Map(utilisateurs.map(u => [u.email, u.id]));

    const creees = await tx.commande.createManyAndReturn({
      data: commandes.map(c => {
        const qui = c.client ?? c.invite;
        const centimes = c.lignes.reduce((total, l) => total + enCentimes(l.vetement.prix) * l.quantite, 0);
        return {
          utilisateurId: c.client ? idClient.get(c.client.email) : null,
          nomClient: qui.nom,
          email: qui.email,
          adresse: qui.adresse,
          total: (centimes / 100).toFixed(2),
          statut: c.statut,
          creeLe: c.date,
        };
      }),
      select: { id: true },
    });

    const lignes = commandes.flatMap((c, i) =>
      c.lignes.map(l => ({
        commandeId: creees[i].id,
        vetementId: idVetement.get(l.vetement.nom),
        nom: l.vetement.nom,
        taille: l.taille,
        prixUnitaire: l.vetement.prix,
        quantite: l.quantite,
      }))
    );
    await tx.ligneCommande.createMany({ data: lignes });

    return { lignes: lignes.length };
  }, { timeout: 120000 });

const debut = Date.now();
const emailsPris = new Set();
const catalogue = genererCatalogue();
const clients = genererClients(emailsPris);
const commandes = genererCommandes(catalogue, clients, emailsPris);
const hash = await bcrypt.hash(MOT_DE_PASSE_DEMO, 10);
const { lignes } = await inserer(catalogue, clients, commandes, hash);

const [nbVetements, nbClients, nbCommandes, enAttente, chiffre] = await Promise.all([
  prisma.vetement.count(),
  prisma.utilisateur.count({ where: { role: 'client' } }),
  prisma.commande.count(),
  prisma.commande.count({ where: { statut: 'en_attente' } }),
  prisma.commande.aggregate({ where: { statut: { not: 'annulee' } }, _sum: { total: true } }),
]);
console.log(`${nbVetements} vêtements, ${nbClients} clients, ${nbCommandes} commandes (${lignes} lignes, ${enAttente} en attente)`);
console.log(`Chiffre d'affaires : ${chiffre._sum.total.toNumber().toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`);
console.log(`Mot de passe de tous les clients de démo : ${MOT_DE_PASSE_DEMO} (ex. ${clients.at(0).email})`);
console.log(`Terminé en ${((Date.now() - debut) / 1000).toFixed(1)} s`);
await prisma.$disconnect();
