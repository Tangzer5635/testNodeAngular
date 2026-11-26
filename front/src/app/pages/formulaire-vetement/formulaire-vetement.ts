import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VetementService } from '../../services/vetement';
import { CategorieService } from '../../services/categorie';

@Component({
  selector: 'app-formulaire-vetement',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './formulaire-vetement.html',
  styleUrl: './formulaire-vetement.scss',
})
export class FormulaireVetement {
  private vetementService = inject(VetementService);
  private categorieService = inject(CategorieService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected categories = signal<string[]>([]);
  protected erreur = signal<string | null>(null);
  protected id = signal<number | null>(null);

  protected vetementForm = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    description: [''],
    prix: [0, [Validators.required, Validators.min(0)]],
    image: [''],
    tailles: ['', Validators.required],
    categorie: ['', Validators.required],
  });

  constructor() {
    this.categorieService.getAll().subscribe({
      next: data => this.categories.set(data),
      error: () => this.erreur.set('Impossible de charger les catégories.'),
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam !== null) {
      const id = Number(idParam);
      this.id.set(id);
      this.vetementService.getById(id).subscribe({
        next: vetement => this.vetementForm.patchValue({
          nom: vetement.nom,
          description: vetement.description ?? '',
          prix: vetement.prix,
          image: vetement.image ?? '',
          tailles: vetement.tailles.join(', '),
          categorie: vetement.categorie,
        }),
        error: err => this.erreur.set(
          err.status === 404 ? "Ce vêtement n'existe pas." : 'Impossible de charger ce vêtement.'
        ),
      });
    }
  }

  protected enregistrer() {
    if (this.vetementForm.invalid) {
      this.vetementForm.markAllAsTouched();
      return;
    }

    const valeurs = this.vetementForm.getRawValue();
    const vetement = {
      ...valeurs,
      prix: Number(valeurs.prix),
      tailles: valeurs.tailles
        .split(',')
        .map(taille => taille.trim())
        .filter(taille => taille !== ''),
    };

    const id = this.id();
    const requete = id === null
      ? this.vetementService.create(vetement)
      : this.vetementService.update(id, vetement);

    this.erreur.set(null);
    requete.subscribe({
      next: () => this.router.navigate(['/admin']),
      error: err => this.erreur.set(err.error?.message ?? "Impossible d'enregistrer le vêtement."),
    });
  }
}