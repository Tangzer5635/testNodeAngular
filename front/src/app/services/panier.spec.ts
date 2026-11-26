import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PanierService, QUANTITE_MAX } from './panier';
import { Vetement } from '../models/vetement';

const jean: Vetement = {
  id: 1, nom: 'Jean', description: '', prix: 49.99, image: 'jean.jpg', categorie: 'pantalons',
  tailles: [{ taille: '38', stock: 20 }, { taille: '40', stock: 20 }, { taille: '42', stock: 2 }, { taille: '44', stock: 0 }],
};
const sweat: Vetement = {
  id: 2, nom: 'Sweat', description: '', prix: 39.99, image: 'sweat.jpg', categorie: 'sweats',
  tailles: [{ taille: 'M', stock: 5 }],
};

const creerService = () => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  return TestBed.inject(PanierService);
};

describe('PanierService', () => {
  let panier: PanierService;

  beforeEach(() => {
    localStorage.clear();
    panier = creerService();
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

  it('ne dépasse jamais le stock de la taille', () => {
    for (let i = 0; i < 5; i++) {
      panier.ajouter(jean, '42'); // seulement 2 en stock
    }
    expect(panier.lignes()[0].quantite).toBe(2);
    panier.changerQuantite(panier.lignes()[0], 8);
    expect(panier.lignes()[0].quantite).toBe(2);
  });

  it("n'ajoute pas une taille épuisée", () => {
    panier.ajouter(jean, '44');
    expect(panier.lignes()).toEqual([]);
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

  it('ignore un localStorage abîmé et accepte un ancien panier sans stock', () => {
    localStorage.setItem('panier', JSON.stringify([
      { vetementId: 1 },
      'n\'importe quoi',
      { vetementId: 2, nom: 'Sweat', prix: 39.99, image: '', taille: 'M', quantite: 999 },
    ]));
    const relu = creerService();
    expect(relu.lignes().length).toBe(1);
    expect(relu.lignes()[0].quantite).toBe(QUANTITE_MAX);
    expect(relu.lignes()[0].stock).toBe(QUANTITE_MAX);
  });

  it('se synchronise : nouveau prix, article disparu retiré, quantité réduite au stock', () => {
    panier.ajouter(jean, '40');
    panier.changerQuantite(panier.lignes()[0], 6);
    panier.ajouter(sweat, 'M');
    // Dans la boutique : le jean a baissé (29,99 €) et il n'en reste que 4 en 40 ; le sweat n'existe plus
    const message = panier.synchroniser([{ ...jean, prix: 29.99, tailles: [{ taille: '40', stock: 4 }] }]);
    expect(panier.lignes().length).toBe(1);
    expect(panier.lignes()[0].prix).toBe(29.99);
    expect(panier.lignes()[0].quantite).toBe(4);
    expect(message).toContain("n'est plus disponible");
    expect(message).toContain('réduite');
  });

  it('se synchronise : une taille devenue épuisée est retirée', () => {
    panier.ajouter(sweat, 'M');
    panier.synchroniser([{ ...sweat, tailles: [{ taille: 'M', stock: 0 }] }]);
    expect(panier.lignes()).toEqual([]);
  });
});
