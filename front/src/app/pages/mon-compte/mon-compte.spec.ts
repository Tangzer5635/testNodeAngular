import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { enFrancais } from '../../testing/francais';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MonCompte } from './mon-compte';
import { Commande } from '../../models/commande';
import { jetonDe } from '../../testing/jetons';

const commande: Commande = {
  id: 5, utilisateurId: 7, nomClient: 'Léa Martin', email: 'lea@test.fr', adresse: 'Lyon', total: 89.98,
  statut: 'expediee', creeLe: '2026-11-20T10:00:00Z',
  lignes: [{ vetementId: 7, nom: 'Sweat à capuche gris', taille: 'M', prixUnitaire: 44.99, quantite: 2 }],
};

const afficher = async (commandes: Commande[]) => {
  localStorage.clear();
  localStorage.setItem('jeton', jetonDe('client', { nom: 'Léa Martin', email: 'lea@test.fr' }));
  TestBed.configureTestingModule({
    imports: [MonCompte],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), enFrancais],
  });
  const fixture = TestBed.createComponent(MonCompte);
  TestBed.inject(HttpTestingController)
    .expectOne(r => r.url.endsWith('/commandes/miennes'))
    .flush(commandes, { headers: { 'X-Total-Count': String(commandes.length) } });
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('Mon compte', () => {
  it('salue le client par son nom', async () => {
    const page = await afficher([]);
    expect(page.querySelector('h1')?.textContent).toContain('Bonjour Léa Martin');
    expect(page.querySelector('.email')?.textContent).toContain('lea@test.fr');
  });

  it('liste ses commandes avec le statut et le total', async () => {
    const page = await afficher([commande]);
    const article = page.querySelector('article')!;
    expect(article.querySelector('h3')?.textContent).toContain('Commande n°5');
    expect(article.querySelector('.statut')?.textContent).toContain('Expédiée');
    expect(article.textContent).toContain('2 × Sweat à capuche gris (M)');
    expect(article.querySelector('.total')?.textContent).toContain('89,98');
  });

  it("invite à découvrir le catalogue s'il n'a encore rien commandé", async () => {
    const page = await afficher([]);
    expect(page.querySelector('.vide')?.textContent).toContain("pas encore passé de commande");
  });

  it('découpe un long historique en pages de 10 et suit la page de l\'adresse', async () => {
    localStorage.setItem('jeton', jetonDe('client', { nom: 'Léa Martin', email: 'lea@test.fr' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'mon-compte', component: MonCompte }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        enFrancais,
      ],
    });
    const harness = await RouterTestingHarness.create('/mon-compte?page=2');
    const http = TestBed.inject(HttpTestingController);
    const requete = http.expectOne(r => r.url.endsWith('/commandes/miennes'));
    expect(requete.request.params.get('page')).toBe('2');
    requete.flush(Array.from({ length: 10 }, (_, i) => ({ ...commande, id: 13 - i })), { headers: { 'X-Total-Count': '23' } });
    await harness.fixture.whenStable();
    const page = harness.routeNativeElement as HTMLElement;
    expect(page.querySelector('.compteur')?.textContent).toContain('23 commandes');
    expect(page.querySelectorAll('article').length).toBe(10);
    expect(page.querySelector('app-pagination [aria-current="page"]')?.textContent?.trim()).toBe('2');

    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    [...page.querySelectorAll<HTMLButtonElement>('app-pagination button')].find(b => b.textContent?.trim() === '3')!.click();
    await harness.fixture.whenStable();
    expect(http.expectOne(r => r.url.endsWith('/commandes/miennes')).request.params.get('page')).toBe('3');
  });
});
