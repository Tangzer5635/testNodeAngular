import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
import { PanierService } from './services/panier';

describe('App (header)', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  it('affiche le catalogue, le panier et la connexion quand on n\'est pas connecté', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const liens = [...fixture.nativeElement.querySelectorAll('nav a')].map((a: HTMLElement) => a.textContent?.trim());
    expect(liens).toEqual(['Catalogue', 'Panier', 'Connexion']);
  });

  it('affiche le nombre d\'articles du panier dans un badge', async () => {
    const fixture = TestBed.createComponent(App);
    const panier = TestBed.inject(PanierService);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.badge')).toBeNull();

    const vetement = { id: 1, nom: 'Jean', description: '', prix: 50, tailles: ['40'], image: '', categorie: 'pantalons' };
    panier.ajouter(vetement, '40');
    panier.ajouter(vetement, '40');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.badge')?.textContent.trim()).toBe('2');
  });
});
