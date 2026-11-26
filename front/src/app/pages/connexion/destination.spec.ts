import { destinationApresConnexion } from './destination';
import { UtilisateurConnecte } from '../../services/auth';

const admin: UtilisateurConnecte = { id: 1, email: 'a@test.fr', nom: 'Admin', role: 'admin' };
const client: UtilisateurConnecte = { id: 2, email: 'c@test.fr', nom: 'Léa', role: 'client' };

describe('Destination après connexion', () => {
  it("sans page demandée : l'admin va à l'administration, le client à son compte", () => {
    expect(destinationApresConnexion(admin, null)).toBe('/admin');
    expect(destinationApresConnexion(client, null)).toBe('/mon-compte');
  });

  it('revient à la page de commande pour tout le monde', () => {
    expect(destinationApresConnexion(client, '/commande')).toBe('/commande');
    expect(destinationApresConnexion(admin, '/commande')).toBe('/commande');
  });

  it("l'admin revient sur la page d'admin demandée", () => {
    expect(destinationApresConnexion(admin, '/admin/commandes')).toBe('/admin/commandes');
  });

  it("un client n'est jamais renvoyé vers l'administration", () => {
    expect(destinationApresConnexion(client, '/admin')).toBe('/mon-compte');
  });

  it('ignore une adresse extérieure', () => {
    expect(destinationApresConnexion(client, 'https://pirate.example')).toBe('/mon-compte');
    expect(destinationApresConnexion(admin, '//pirate.example')).toBe('/admin');
  });
});
