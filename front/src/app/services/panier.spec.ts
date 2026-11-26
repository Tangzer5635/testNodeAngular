import { TestBed } from '@angular/core/testing';
import { PanierService, QUANTITE_MAX } from './panier';
import { Vetement } from '../models/vetement';

const jean: Vetement = { id: 1, nom: 'Jean', description: '', prix: 49.99, tailles: ['38', '40'], image: 'jean.jpg', categorie: 'pantalons' };
const sweat: Vetement = { id: 2, nom: 'Sweat', description: '', prix: 39.99, tailles: ['M'], image: 'sweat.jpg', categorie: 'sweats' };

describe('PanierService', () => {
  let panier: PanierService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    panier = TestBed.inject(PanierService);
  });

  it('regroupe le même vêtement dans la même taille', () => {
    panier.ajouter(jean, '40');
    panier.ajouter(jean, '40');
    panier.ajouter(jean, '38');
    expect(panier.lignes().length).toBe(2);
    expect(panier.nombreArticles()).toBe(3);
  });

  it('calcule le total', () => {
    panier.ajouter(jean, '40');
    panier.ajouter(sweat, 'M');
    expect(panier.total()).toBeCloseTo(89.98);
  });

  it(`ne dépasse jamais ${QUANTITE_MAX} exemplaires par ligne`, () => {
    for (let i = 0; i < 15; i++) {
      panier.ajouter(jean, '40');
    }
    expect(panier.lignes()[0].quantite).toBe(QUANTITE_MAX);
  });

  it('retire la ligne quand la quantité passe à 0', () => {
    panier.ajouter(jean, '40');
    panier.changerQuantite(panier.lignes()[0], 0);
    expect(panier.lignes()).toEqual([]);
  });

  it('sauvegarde le panier dans le localStorage', () => {
    panier.ajouter(jean, '40');
    TestBed.tick(); // exécute l'effect de sauvegarde
    expect(JSON.parse(localStorage.getItem('panier')!)[0].vetementId).toBe(1);
  });

  it('ignore un localStorage abîmé ou modifié à la main', () => {
    localStorage.setItem('panier', JSON.stringify([{ vetementId: 1 }, 'n\'importe quoi', { vetementId: 2, nom: 'Sweat', prix: 39.99, image: '', taille: 'M', quantite: 999 }]));
    TestBed.resetTestingModule();
    const relu = TestBed.inject(PanierService);
    expect(relu.lignes().length).toBe(1);
    expect(relu.lignes()[0].quantite).toBe(QUANTITE_MAX);
  });

  it('se synchronise avec la boutique : nouveau prix, articles disparus retirés', () => {
    panier.ajouter(jean, '40');
    panier.ajouter(sweat, 'M');
    const retirees = panier.synchroniser([{ ...jean, prix: 29.99 }]); // le sweat n'existe plus
    expect(retirees).toBe(1);
    expect(panier.lignes().length).toBe(1);
    expect(panier.lignes()[0].prix).toBe(29.99);
  });
});
