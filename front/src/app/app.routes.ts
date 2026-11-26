import { Routes } from '@angular/router';
import { Catalogue } from './pages/catalogue/catalogue';
import { Fiche } from './pages/fiche/fiche';
import { Admin } from './pages/admin/admin';
import { FormulaireVetement } from './pages/formulaire-vetement/formulaire-vetement';
import { Connexion } from './pages/connexion/connexion';
import { Panier } from './pages/panier/panier';
import { authGuard, inviteGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Pages publiques
  { path: '', component: Catalogue },
  { path: 'vetements/:id', component: Fiche },
  { path: 'connexion', component: Connexion, canActivate: [inviteGuard] },
  { path: 'panier', component: Panier },

  // Pages réservées à l'admin : le guard s'applique à toutes les routes enfants
  {
    path: 'admin',
    canActivateChild: [authGuard],
    children: [
      { path: '', component: Admin },
      { path: 'nouveau', component: FormulaireVetement },
      { path: ':id', component: FormulaireVetement },
    
      { path: 'panier', component: Panier }],
  },

  // Toute autre adresse : retour au catalogue
  { path: '**', redirectTo: '' },
];