import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { Catalogue } from './pages/catalogue/catalogue';
import { Fiche } from './pages/fiche/fiche';
import { Admin } from './pages/admin/admin';

export const routes: Routes = [
  { path: '', component: Catalogue },
  { path: 'vetements/:id', component: Fiche },
  { path: 'admin', component: Admin }
];