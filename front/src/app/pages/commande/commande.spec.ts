import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { enFrancais } from '../../testing/francais';
import { provideRouter } from '@angular/router';
import { Commande } from './commande';
import { PanierService } from '../../services/panier';
import { jetonDe } from '../../testing/jetons';

const ligne = { vetementId: 3, nom: 'Jean slim bleu', prix: 49.99, image: '', taille: '40', quantite: 2, stock: 7 };
const jean = { id: 3, nom: 'Jean slim bleu', description: '', prix: 49.99, image: '', categorie: 'pantalons', tailles: [{ taille: '40', stock: 7 }] };

const afficher = async ({ jeton }: { jeton?: string } = {}) => {
  localStorage.clear();
  localStorage.setItem('panier', JSON.stringify([ligne]));
  if (jeton) {
    localStorage.setItem('jeton', jeton);
  }
  TestBed.configureTestingModule({
    imports: [Commande],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), enFrancais],
  });
  const fixture = TestBed.createComponent(Commande);
  const http = TestBed.inject(HttpTestingController);
  http.expectOne(r => r.url.endsWith('/vetements')).flush([jean]);
  await fixture.whenStable();
  return { fixture, http, page: fixture.nativeElement as HTMLElement };
};

const saisir = (page: HTMLElement, selecteur: string, valeur: string) => {
  const champ = page.querySelector<HTMLInputElement | HTMLTextAreaElement>(selecteur)!;
  champ.value = valeur;
  champ.dispatchEvent(new Event('input'));
};

const valider = async (fixture: { whenStable: () => Promise<unknown> }, page: HTMLElement) => {
  page.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
  await fixture.whenStable();
};

describe('Page commande', () => {
  it('affiche le récapitulatif du panier', async () => {
    const { page } = await afficher();
    expect(page.querySelector('.recapitulatif')?.textContent).toContain('2 × Jean slim bleu');
    expect(page.querySelector('.recapitulatif .total')?.textContent).toContain('99,98');
  });

  it("propose de se connecter à un visiteur", async () => {
    const { page } = await afficher();
    expect(page.querySelector('.compte a')?.getAttribute('href')).toBe('/connexion?retour=%2Fcommande');
  });

  it("préremplit le nom et l'email d'un client connecté, et bloque l'email", async () => {
    const { page } = await afficher({ jeton: jetonDe('client', { nom: 'Hugo Bernard', email: 'hugo@test.fr' }) });
    expect(page.querySelector<HTMLInputElement>('input[formcontrolname=nom]')!.value).toBe('Hugo Bernard');
    const email = page.querySelector<HTMLInputElement>('input[formcontrolname=email]')!;
    expect(email.value).toBe('hugo@test.fr');
    expect(email.disabled).toBe(true);
    expect(page.querySelector('.compte')).toBeNull();
  });

  it("n'envoie rien tant que le formulaire est incomplet", async () => {
    const { fixture, http, page } = await afficher();
    await valider(fixture, page);
    http.expectNone(r => r.method === 'POST');
    expect(page.querySelectorAll('form small').length).toBe(3);
  });

  it("envoie les articles sans aucun prix, puis vide le panier", async () => {
    const { fixture, http, page } = await afficher();
    saisir(page, 'input[formcontrolname=nom]', 'Léa Martin');
    saisir(page, 'input[formcontrolname=email]', 'lea@test.fr');
    saisir(page, 'textarea', '12 rue de la Paix, Lyon');
    await valider(fixture, page);

    const requete = http.expectOne(r => r.method === 'POST' && r.url.endsWith('/commandes'));
    expect(requete.request.body).toEqual({
      client: { nom: 'Léa Martin', email: 'lea@test.fr', adresse: '12 rue de la Paix, Lyon' },
      lignes: [{ vetementId: 3, taille: '40', quantite: 2 }],
    });
    requete.flush({ id: 12, total: 99.98 });
    await fixture.whenStable();

    expect(page.querySelector('.merci')?.textContent).toContain('n°12');
    expect(TestBed.inject(PanierService).lignes()).toEqual([]);
  });

  it('stock insuffisant : affiche le message et remet le panier à jour', async () => {
    const { fixture, http, page } = await afficher();
    saisir(page, 'input[formcontrolname=nom]', 'Léa Martin');
    saisir(page, 'input[formcontrolname=email]', 'lea@test.fr');
    saisir(page, 'textarea', '12 rue de la Paix, Lyon');
    await valider(fixture, page);

    http.expectOne(r => r.method === 'POST').flush(
      { message: 'Il ne reste que 1 « Jean slim bleu » en taille 40' },
      { status: 409, statusText: 'Conflict' }
    );
    http.expectOne(r => r.url.endsWith('/vetements')).flush([{ ...jean, tailles: [{ taille: '40', stock: 1 }] }]);
    await fixture.whenStable();

    expect(page.querySelector('.erreur')?.textContent).toContain('Il ne reste que 1');
    expect(TestBed.inject(PanierService).lignes()[0].quantite).toBe(1);
  });
});
