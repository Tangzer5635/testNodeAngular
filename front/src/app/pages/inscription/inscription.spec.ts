import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { Inscription } from './inscription';
import { jetonDe } from '../../testing/jetons';

const afficher = async () => {
  localStorage.clear();
  TestBed.configureTestingModule({
    imports: [Inscription],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(Inscription);
  await fixture.whenStable();
  return { fixture, http: TestBed.inject(HttpTestingController), page: fixture.nativeElement as HTMLElement };
};

const remplir = (page: HTMLElement, valeurs: Record<string, string>) => {
  for (const [nom, valeur] of Object.entries(valeurs)) {
    const champ = page.querySelector<HTMLInputElement>(`input[formcontrolname=${nom}]`)!;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
  }
};

const valider = async (fixture: { whenStable: () => Promise<unknown> }, page: HTMLElement) => {
  page.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
  await fixture.whenStable();
};

const correct = { nom: 'Hugo Bernard', email: 'hugo@test.fr', motDePasse: 'motdepasse1', confirmation: 'motdepasse1' };

describe("Page d'inscription", () => {
  it('signale deux mots de passe différents', async () => {
    const { fixture, http, page } = await afficher();
    remplir(page, { ...correct, confirmation: 'autrechose1' });
    await valider(fixture, page);
    expect(page.textContent).toContain('ne sont pas identiques');
    http.expectNone(r => r.method === 'POST');
  });

  it('refuse un mot de passe sans chiffre', async () => {
    const { fixture, http, page } = await afficher();
    remplir(page, { ...correct, motDePasse: 'motdepasse', confirmation: 'motdepasse' });
    await valider(fixture, page);
    expect(page.textContent).toContain('au moins une lettre et un chiffre');
    http.expectNone(r => r.method === 'POST');
  });

  it("crée le compte puis emmène le client vers son compte", async () => {
    const { fixture, http, page } = await afficher();
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    remplir(page, correct);
    await valider(fixture, page);

    const requete = http.expectOne(r => r.url.endsWith('/auth/inscription'));
    expect(requete.request.body).toEqual({ nom: 'Hugo Bernard', email: 'hugo@test.fr', motDePasse: 'motdepasse1' });
    requete.flush({ token: jetonDe('client', { nom: 'Hugo Bernard' }) }, { status: 201, statusText: 'Created' });

    expect(navigation).toHaveBeenCalledWith('/mon-compte');
  });

  it('affiche le message du serveur si l\'email est déjà pris', async () => {
    const { fixture, http, page } = await afficher();
    remplir(page, correct);
    await valider(fixture, page);
    http.expectOne(r => r.url.endsWith('/auth/inscription')).flush(
      { message: 'Un compte existe déjà avec cette adresse email' },
      { status: 409, statusText: 'Conflict' }
    );
    await fixture.whenStable();
    expect(page.querySelector('.erreur')?.textContent).toContain('existe déjà');
  });
});
