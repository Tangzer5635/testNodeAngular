import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { destinationApresConnexion } from '../connexion/destination';

const memeMotDePasse = (groupe: AbstractControl): ValidationErrors | null =>
  groupe.get('motDePasse')?.value === groupe.get('confirmation')?.value ? null : { differents: true };

@Component({
  selector: 'app-inscription',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './inscription.html',
  styleUrl: '../connexion/connexion.scss',
})
export class Inscription {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected retour = inject(ActivatedRoute).snapshot.queryParamMap.get('retour');
  protected erreur = signal<string | null>(null);
  protected enCours = signal(false);

  protected inscriptionForm = this.fb.nonNullable.group(
    {
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: [
        '',
        [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)],
      ],
      confirmation: ['', Validators.required],
    },
    { validators: memeMotDePasse }
  );

  protected creerCompte() {
    if (this.inscriptionForm.invalid) {
      this.inscriptionForm.markAllAsTouched();
      return;
    }
    const { nom, email, motDePasse } = this.inscriptionForm.getRawValue();
    this.erreur.set(null);
    this.enCours.set(true);

    this.auth.inscription(nom, email, motDePasse).subscribe({
      next: utilisateur => this.router.navigateByUrl(destinationApresConnexion(utilisateur, this.retour)),
      error: err => {
        this.enCours.set(false);
        this.erreur.set(
          [400, 409, 429].includes(err.status)
            ? err.error?.message ?? 'Inscription impossible.'
            : 'Impossible de créer le compte. Réessaie dans un instant.'
        );
      },
    });
  }
}
