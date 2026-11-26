import { Routes } from '@angular/router';
import { Catalogue } from './pages/catalogue/catalogue';
import { Fiche } from './pages/fiche/fiche';
import { Admin } from './pages/admin/admin';
import { FormulaireVetement } from './pages/formulaire-vetement/formulaire-vetement';
import { Connexion } from './pages/connexion/connexion';
import { Panier } from './pages/panier/panier';
import { Commande } from './pages/commande/commande';
import { AdminCommandes } from './pages/admin-commandes/admin-commandes';
import { authGuard, inviteGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Catalogue },
  { path: 'vetements/:id', component: Fiche },
  { path: 'connexion', component: Connexion, canActivate: [inviteGuard] },
  { path: 'panier', component: Panier },
  { path: 'commande', component: Commande },

  {
    path: 'admin',
    canActivateChild: [authGuard],
    children: [
      { path: '', component: Admin },
      { path: 'nouveau', component: FormulaireVetement },
      { path: 'commandes', component: AdminCommandes },
      { path: ':id', component: FormulaireVetement },
    ],
  },

  { path: '**', redirectTo: '' },
];
