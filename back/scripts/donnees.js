export const CATEGORIES = ['t-shirts', 'chemises', 'pulls', 'sweats', 'vestes', 'manteaux', 'pantalons', 'accessoires'];

export const TAILLES = {
  haut: ['XS', 'S', 'M', 'L', 'XL'],
  bas: ['36', '38', '40', '42', '44', '46'],
  unique: ['Unique'],
};

export const CATALOGUE = [
  { nom: 'T-shirt blanc classique', categorie: 't-shirts', prix: 19.99, image: 'tshirt-blanc.jpg', tailles: 'haut', description: 'T-shirt blanc en coton, confortable et facile à porter au quotidien.' },
  { nom: 'T-shirt noir oversize', categorie: 't-shirts', prix: 24.99, image: 'tshirt-noir.jpg', tailles: 'haut', description: 'T-shirt noir coupe oversize, imprimé discret sur la poitrine.' },
  { nom: 'T-shirt blanc coton bio', categorie: 't-shirts', prix: 22.99, image: 'tshirt-blanc-bio.jpg', tailles: 'haut', description: 'Coton biologique épais, col rond côtelé, coupe droite.' },
  { nom: 'T-shirt noir col rond', categorie: 't-shirts', prix: 19.99, image: 'tshirt-noir-col-rond.jpg', tailles: 'haut', description: 'Le basique noir : jersey de coton souple et coupe ajustée.' },
  { nom: 'T-shirt marinière', categorie: 't-shirts', prix: 29.99, image: 'tshirt-mariniere.jpg', tailles: 'haut', description: 'Rayures noires et blanches, coton peigné, esprit bord de mer.' },
  { nom: 'Polo bleu', categorie: 't-shirts', prix: 34.99, image: 'polo-bleu.jpg', tailles: 'haut', description: 'Polo en piqué de coton, col boutonné, bleu franc.' },
  { nom: 'Chemise oxford bleue', categorie: 'chemises', prix: 49.99, image: 'chemise-oxford-bleue.jpg', tailles: 'haut', description: 'Toile oxford bleu ciel, col boutonné, coupe droite.' },
  { nom: 'Chemise grise', categorie: 'chemises', prix: 44.99, image: 'chemise-grise.jpg', tailles: 'haut', description: 'Chemise grise manches longues, coton léger, se porte ouverte ou fermée.' },
  { nom: 'Chemise blanche', categorie: 'chemises', prix: 44.99, image: 'chemise-blanche.jpg', tailles: 'haut', description: 'Popeline de coton blanche, col classique, pour le bureau comme le week-end.' },
  { nom: 'Chemise à carreaux grise', categorie: 'chemises', prix: 46.99, image: 'chemise-carreaux.jpg', tailles: 'haut', description: 'Carreaux noirs et gris, coton brossé tout doux.' },
  { nom: 'Chemise en flanelle', categorie: 'chemises', prix: 52.99, image: 'chemise-flanelle.jpg', tailles: 'haut', description: 'Flanelle à carreaux bleus et bruns, chaude pour la mi-saison.' },
  { nom: 'Pull en laine gris', categorie: 'pulls', prix: 69.99, image: 'pull-laine-gris.jpg', tailles: 'haut', description: 'Laine mérinos gris chiné, maille fine qui ne gratte pas.' },
  { nom: 'Pull en maille marron', categorie: 'pulls', prix: 64.99, image: 'pull-maille-marron.jpg', tailles: 'haut', description: 'Grosse maille marron, col rond, chaleur garantie.' },
  { nom: 'Pull rouille', categorie: 'pulls', prix: 64.99, image: 'pull-rouille.jpg', tailles: 'haut', description: 'Maille épaisse couleur rouille, finitions brutes.' },
  { nom: 'Pull vert marguerites', categorie: 'pulls', prix: 59.99, image: 'pull-vert-marguerites.jpg', tailles: 'haut', description: 'Pull vert brodé de marguerites blanches, pièce signature.' },
  { nom: 'Sweat beige', categorie: 'sweats', prix: 44.99, image: 'sweat-beige.jpg', tailles: 'haut', description: 'Sweat beige minimaliste, parfait pour un look casual.' },
  { nom: 'Sweat à capuche gris', categorie: 'sweats', prix: 39.99, image: 'sweat-gris.jpg', tailles: 'haut', description: 'Sweat à capuche gris en coton doux avec poche kangourou.' },
  { nom: 'Hoodie blanc', categorie: 'sweats', prix: 49.99, image: 'hoodie-blanc.jpg', tailles: 'haut', description: 'Molleton blanc cassé, capuche doublée, coupe ample.' },
  { nom: 'Hoodie noir', categorie: 'sweats', prix: 49.99, image: 'hoodie-noir.jpg', tailles: 'haut', description: 'Le hoodie noir de tous les jours, molleton gratté.' },
  { nom: 'Hoodie marron', categorie: 'sweats', prix: 54.99, image: 'hoodie-marron.jpg', tailles: 'haut', description: 'Brun chocolat, coton épais, poche kangourou.' },
  { nom: 'Hoodie bicolore jaune', categorie: 'sweats', prix: 54.99, image: 'hoodie-jaune.jpg', tailles: 'haut', description: 'Jaune et noir, pour ne pas passer inaperçu.' },
  { nom: 'Veste en jean', categorie: 'vestes', prix: 69.99, image: 'veste-jean.jpg', tailles: 'haut', description: 'Veste en jean brut, col en velours côtelé.' },
  { nom: 'Blouson noir', categorie: 'vestes', prix: 89.99, image: 'blouson-noir.jpg', tailles: 'haut', description: 'Blouson noir élégant avec fermeture zippée.' },
  { nom: 'Bomber marron', categorie: 'vestes', prix: 99.99, image: 'bomber-marron.jpg', tailles: 'haut', description: 'Bomber marron, bords côtelés, doublure légère.' },
  { nom: 'Veste en cuir camel', categorie: 'vestes', prix: 189.99, image: 'veste-cuir-camel.jpg', tailles: 'haut', description: 'Cuir pleine fleur camel qui se patine avec le temps.' },
  { nom: 'Veste en jean verte', categorie: 'vestes', prix: 74.99, image: 'veste-jean-verte.jpg', tailles: 'haut', description: 'Denim teint vert sauge, coupe trucker.' },
  { nom: 'Veste en jean délavée', categorie: 'vestes', prix: 69.99, image: 'veste-jean-delavee.jpg', tailles: 'haut', description: 'Denim délavé clair, esprit vintage.' },
  { nom: 'Blouson zippé noir', categorie: 'vestes', prix: 79.99, image: 'blouson-zippe-noir.jpg', tailles: 'haut', description: 'Blouson technique léger, déperlant, zip intégral.' },
  { nom: 'Manteau en laine camel', categorie: 'manteaux', prix: 219.99, image: 'manteau-camel.jpg', tailles: 'haut', description: 'Laine mélangée camel, coupe longue, boutonnage simple.' },
  { nom: 'Manteau croisé marron', categorie: 'manteaux', prix: 239.99, image: 'manteau-croise.jpg', tailles: 'haut', description: 'Revers crantés, double boutonnage, drap de laine.' },
  { nom: 'Manteau droit cognac', categorie: 'manteaux', prix: 199.99, image: 'manteau-cognac.jpg', tailles: 'haut', description: 'Manteau droit couleur cognac, intemporel.' },
  { nom: 'Jean slim bleu', categorie: 'pantalons', prix: 49.99, image: 'jean-bleu.jpg', tailles: 'bas', description: 'Jean slim bleu avec une coupe moderne et confortable.' },
  { nom: 'Pantalon cargo beige', categorie: 'pantalons', prix: 54.99, image: 'cargo-beige.jpg', tailles: 'bas', description: 'Pantalon beige avec plusieurs poches pratiques.' },
  { nom: 'Jean droit brut', categorie: 'pantalons', prix: 59.99, image: 'jean-brut.jpg', tailles: 'bas', description: 'Denim brut bleu nuit, coupe droite qui se forme à vous.' },
  { nom: 'Jean noir', categorie: 'pantalons', prix: 54.99, image: 'jean-noir.jpg', tailles: 'bas', description: 'Jean noir profond, légèrement stretch.' },
  { nom: 'Jean regular délavé', categorie: 'pantalons', prix: 49.99, image: 'jean-delave.jpg', tailles: 'bas', description: 'Coupe regular, délavage moyen, le jean qui va avec tout.' },
  { nom: 'Chino marron', categorie: 'pantalons', prix: 54.99, image: 'chino-marron.jpg', tailles: 'bas', description: 'Chino en sergé de coton, couleur tabac.' },
  { nom: 'Bonnet noir', categorie: 'accessoires', prix: 19.99, image: 'bonnet-noir.jpg', tailles: 'unique', description: 'Bonnet côtelé noir, revers large.' },
  { nom: 'Bonnet écru', categorie: 'accessoires', prix: 19.99, image: 'bonnet-ecru.jpg', tailles: 'unique', description: 'Maille épaisse écrue, douce et chaude.' },
  { nom: 'Bonnet bleu', categorie: 'accessoires', prix: 19.99, image: 'bonnet-bleu.jpg', tailles: 'unique', description: 'Bleu profond, laine mélangée.' },
  { nom: 'Chapeau en feutre', categorie: 'accessoires', prix: 49.99, image: 'chapeau-feutre.jpg', tailles: 'unique', description: 'Feutre de laine marron, bord moyen.' },
];

export const PRENOMS = ['Léa', 'Hugo', 'Chloé', 'Lucas', 'Inès', 'Louis', 'Manon', 'Gabriel', 'Camille', 'Arthur', 'Sarah', 'Jules', 'Emma', 'Adam', 'Jade', 'Raphaël', 'Louise', 'Nathan', 'Alice', 'Tom', 'Lina', 'Théo', 'Zoé', 'Noah', 'Lola', 'Paul', 'Clara', 'Ethan', 'Anna', 'Maël', 'Rose', 'Sacha', 'Juliette', 'Nolan', 'Ambre', 'Mathis', 'Léna', 'Enzo', 'Eva', 'Victor', 'Margaux', 'Antoine', 'Agathe', 'Maxime', 'Mila', 'Baptiste', 'Romane', 'Yanis', 'Nina', 'Clément', 'Elsa', 'Axel', 'Charlotte', 'Liam', 'Pauline', 'Samuel', 'Océane', 'Benjamin', 'Lucie', 'Kylian'];

export const NOMS = ['Martin', 'Bernard', 'Petit', 'Moreau', 'Durand', 'Dubois', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefèvre', 'Faure', 'André', 'Mercier', 'Blanc', 'Guérin', 'Boyer', 'Garnier', 'Chevalier', 'François', 'Legrand', 'Gauthier', 'Garcia', 'Perrin', 'Robin', 'Clément', 'Morin', 'Nicolas', 'Henry', 'Roussel', 'Mathieu', 'Gautier', 'Masson', 'Marchand', 'Duval', 'Denis', 'Dumont', 'Marie', 'Lemaire', 'Noël', 'Meyer', 'Dufour', 'Meunier', 'Brun', 'Blanchard', 'Giraud'];

export const DOMAINES = ['gmail.com', 'outlook.fr', 'icloud.com', 'orange.fr', 'free.fr', 'hotmail.fr', 'yahoo.fr', 'laposte.net'];

export const RUES = ['rue de la République', 'rue Victor Hugo', 'avenue Jean Jaurès', 'rue du Président Édouard Herriot', 'boulevard de la Croix-Rousse', 'rue Mercière', 'quai Saint-Antoine', 'rue de la Paix', 'avenue Foch', 'rue Garibaldi', 'cours Lafayette', 'rue des Lilas', 'impasse des Roses', 'rue Pasteur', 'place Bellecour', 'rue Nationale', 'avenue de la Gare', 'rue du Moulin', 'chemin des Vignes', 'rue Gambetta', 'boulevard Voltaire', 'rue Saint-Michel', 'allée des Tilleuls', 'rue de Strasbourg'];

export const VILLES = [['69002', 'Lyon'], ['69003', 'Lyon'], ['69007', 'Lyon'], ['75011', 'Paris'], ['75018', 'Paris'], ['75015', 'Paris'], ['13006', 'Marseille'], ['31000', 'Toulouse'], ['33000', 'Bordeaux'], ['44000', 'Nantes'], ['59000', 'Lille'], ['67000', 'Strasbourg'], ['35000', 'Rennes'], ['34000', 'Montpellier'], ['06000', 'Nice'], ['38000', 'Grenoble'], ['21000', 'Dijon'], ['37000', 'Tours'], ['29200', 'Brest'], ['63000', 'Clermont-Ferrand'], ['74000', 'Annecy'], ['64200', 'Biarritz']];
