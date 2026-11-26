import { Routes } from '@angular/router';
import { Catalogue } from './pages/catalogue/catalogue';
import { Fiche } from './pages/fiche/fiche';
import { Admin } from './pages/admin/admin';
import { FormulaireVetement } from './pages/formulaire-vetement/formulaire-vetement';

export const routes: Routes = [
  { path: '', component: Catalogue },
  { path: 'vetements/:id', component: Fiche },
  { path: 'admin', component: Admin },
  { path: 'admin/nouveau', component: FormulaireVetement },
  { path: 'admin/:id', component: FormulaireVetement },
];