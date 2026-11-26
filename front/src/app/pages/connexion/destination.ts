import { UtilisateurConnecte } from '../../services/auth';

export const destinationApresConnexion = (utilisateur: UtilisateurConnecte, retour: string | null): string => {
  const pagesAutorisees = utilisateur.role === 'admin' ? ['/admin', '/commande'] : ['/mon-compte', '/commande'];
  if (retour && pagesAutorisees.some(page => retour.startsWith(page))) {
    return retour;
  }
  return utilisateur.role === 'admin' ? '/admin' : '/mon-compte';
};
