import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-connexion',
  imports: [ReactiveFormsModule],
  templateUrl: './connexion.html',
  styleUrl: './connexion.scss',
})
export class Connexion {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

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
      next: () => {
        const retour = this.route.snapshot.queryParamMap.get('retour');
        this.router.navigateByUrl(retour?.startsWith('/admin') ? retour : '/admin');
      },
      error: err => {
        this.enCours.set(false);
        this.erreur.set(
          err.status === 401 ? err.error?.message ?? 'Identifiants incorrects.' : 'Impossible de se connecter.'
        );
      },
    });
  }
}
