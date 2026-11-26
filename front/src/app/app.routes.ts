import { Routes } from '@angular/router';
import { Catalogue } from './pages/catalogue/catalogue';
import { Fiche } from './pages/fiche/fiche';
import { Admin } from './pages/admin/admin';
import { FormulaireVetement } from './pages/formulaire-vetement/formulaire-vetement';
import { Connexion } from './pages/connexion/connexion';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Catalogue },
  { path: 'vetements/:id', component: Fiche },
  { path: 'connexion', component: Connexion },
  { path: 'admin', component: Admin, canActivate: [authGuard] },
  { path: 'admin/nouveau', component: FormulaireVetement, canActivate: [authGuard] },
  { path: 'admin/:id', component: FormulaireVetement, canActivate: [authGuard] },
];