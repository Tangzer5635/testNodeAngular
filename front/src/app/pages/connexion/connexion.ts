import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { destinationApresConnexion } from './destination';

@Component({
  selector: 'app-connexion',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './connexion.html',
  styleUrl: './connexion.scss',
})
export class Connexion {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected retour = inject(ActivatedRoute).snapshot.queryParamMap.get('retour');
  protected erreur = signal<string | null>(null);
  protected enCours = signal(false);

  protected connexionForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required],
  });

  protected seConnecter() {
    if (this.connexionForm.invalid) {
      this.connexionForm.markAllAsTouched();
      return;
    }
    const { email, motDePasse } = this.connexionForm.getRawValue();
    this.erreur.set(null);
    this.enCours.set(true);

    this.auth.connexion(email, motDePasse).subscribe({
      next: utilisateur => this.router.navigateByUrl(destinationApresConnexion(utilisateur, this.retour)),
      error: err => {
        this.enCours.set(false);
        this.erreur.set(
          err.status === 401 || err.status === 429
            ? err.error?.message ?? 'Identifiants incorrects.'
            : 'Impossible de se connecter.'
        );
      },
    });
  }
}
