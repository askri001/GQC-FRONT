import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { PRESTATAIRE_SPECIALITES, TypePrestataire, Prestataire } from '../../core/models/prestataire.model';
import { PrestataireService } from '../../core/services/prestataire.service';

@Component({
  selector: 'app-prestataires',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatPaginatorModule,
    MatTabsModule,
    MatCheckboxModule
  ],
  templateUrl: './prestataire.html',
  styleUrls: ['./prestataire-modern.css', './prestataire.css']
})
export class PrestatairesComponent implements OnInit {
  private prestataireService = inject(PrestataireService);
  private snackBar = inject(MatSnackBar);

  activeTab = signal(0);

  
  avocats = signal<Prestataire[]>([]);
  filteredAvocats = signal<Prestataire[]>([]);
  experts = signal<Prestataire[]>([]);
  filteredExperts = signal<Prestataire[]>([]);
  huissiers = signal<Prestataire[]>([]);
  filteredHuissiers = signal<Prestataire[]>([]);

  
  loadingAvocat = signal(false);
  loadingExpert = signal(false);
  loadingHuissier = signal(false);

  
  avocatsEditId = signal<number | null>(null);
  avocatsEditMode = signal(false);
  tempAvocat = signal<Partial<Prestataire> | null>(null);

  expertsEditId = signal<number | null>(null);
  expertsEditMode = signal(false);
  tempExpert = signal<Partial<Prestataire> | null>(null);

  huissiersEditId = signal<number | null>(null);
  huissiersEditMode = signal(false);
  tempHuissier = signal<Partial<Prestataire> | null>(null);

  
  avocatSearch = '';
  avocatActif = '';
  expertSearch = '';
  expertActif = '';
  huissierSearch = '';
  huissierActif = '';

  
  pageSize = 10;
  currentPage = 0;
  displayedColumns = ['adresse', 'nom', 'telephone', 'email', 'specialite', 'tarifJournalier', 'actif', 'actions'];

  specialitesAvocat = PRESTATAIRE_SPECIALITES['AVOCAT'];
  specialitesExpert = PRESTATAIRE_SPECIALITES['EXPERT'];
  specialitesHuissier = PRESTATAIRE_SPECIALITES['HUISSIER'];

  ngOnInit(): void {
    this.loadTabData('AVOCAT');
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.activeTab.set(event.index!);
    const types: TypePrestataire[] = ['AVOCAT', 'EXPERT', 'HUISSIER'];
    this.loadTabData(types[event.index!]);
  }

  loadTabData(type: TypePrestataire): void {
    const setLoading = {
      'AVOCAT': () => this.loadingAvocat.set(true),
      'EXPERT': () => this.loadingExpert.set(true),
      'HUISSIER': () => this.loadingHuissier.set(true)
    };
    setLoading[type]?.();

    this.prestataireService.getByType(type).subscribe({
      next: (data) => {
        const setData = {
          'AVOCAT': () => this.avocats.set(data),
          'EXPERT': () => this.experts.set(data),
          'HUISSIER': () => this.huissiers.set(data)
        };
        setData[type]?.();
        console.log('we re here ',type)
        this.applyFilter(type);
        const setLoadingOff = {
          'AVOCAT': () => this.loadingAvocat.set(false),
          'EXPERT': () => this.loadingExpert.set(false),
          'HUISSIER': () => this.loadingHuissier.set(false)
        };
        setLoadingOff[type]?.();
      },
      error: (error) => {
        console.error(error);
        this.showNotification(`Erreur chargement ${type}`, 'error');
        const setLoadingOff = {
          'AVOCAT': () => this.loadingAvocat.set(false),
          'EXPERT': () => this.loadingExpert.set(false),
          'HUISSIER': () => this.loadingHuissier.set(false)
        };
        setLoadingOff[type]?.();
      }
    });
  }

  applyFilter(type: TypePrestataire): void {
    switch (type) {
      case 'AVOCAT':
        let result = this.avocats();
        if (this.avocatSearch) {
          result = result.filter(p => this.getFullName(p).toLowerCase().includes(this.avocatSearch.toLowerCase()) || 
                                     p.specialite.toLowerCase().includes(this.avocatSearch.toLowerCase()));
        }
        if (this.avocatActif !== '') {
          result = result.filter(p => p.actif === (this.avocatActif === 'true'));
        }
        this.filteredAvocats.set(result);
        break;
      case 'EXPERT':
        let result2 = this.experts();
        if (this.expertSearch) {
          result = result2.filter(p => this.getFullName(p).toLowerCase().includes(this.expertSearch.toLowerCase()) || 
                                     p.specialite.toLowerCase().includes(this.expertSearch.toLowerCase()));
        }
        if (this.expertActif !== '') {
          result = result2.filter(p => p.actif === (this.expertActif === 'true'));
        }
        this.filteredExperts.set(result2);
        break;
      case 'HUISSIER':
        let result3 = this.huissiers();
        if (this.huissierSearch) {
          result = result3.filter(p => this.getFullName(p).toLowerCase().includes(this.huissierSearch.toLowerCase()) || 
                                     p.specialite.toLowerCase().includes(this.huissierSearch.toLowerCase()));
        }
        if (this.huissierActif !== '') {
          result = result3.filter(p => p.actif === (this.huissierActif === 'true'));
        }
        this.filteredHuissiers.set(result3);
        break;
    }
  }

  
  startAvocatInlineEdit(p?: Prestataire): void {
    this.avocatsEditId.set(p?.idPrestataire || 0);
    this.tempAvocat.set(p ? { ...p } : {
      typePrestataire: 'AVOCAT' as const,
      nom: '', prenom: '', telephone: '', email: '', adresse: '',
      specialite: '', tarifJournalier: 0, actif: true
    });
    this.avocatsEditMode.set(true);
  }

  saveAvocatInlineEdit(): void {
    const temp = this.tempAvocat();
    if (!temp) return;
    const request = temp.idPrestataire
      ? this.prestataireService.update(temp.idPrestataire, temp as Prestataire)
      : this.prestataireService.create(temp as Prestataire);
    this.loadingAvocat.set(true);
    request.subscribe({
      next: () => {
        this.loadingAvocat.set(false);
        this.loadTabData('AVOCAT');
        this.cancelAvocatInlineEdit();
        this.showNotification('Avocat sauvegardé', 'success');
      },
      error: () => {
        this.loadingAvocat.set(false);
        this.showNotification('Erreur sauvegarde', 'error');
      }
    });
  }

  cancelAvocatInlineEdit(): void {
    this.avocatsEditId.set(null);
    this.tempAvocat.set(null);
    this.avocatsEditMode.set(false);
  }

  applyAvocatFilter() { this.applyFilter('AVOCAT'); }

  
  startExpertInlineEdit(p?: Prestataire): void {
    this.expertsEditId.set(p?.idPrestataire || 0);
    this.tempExpert.set(p ? { ...p } : {
      typePrestataire: 'EXPERT' as const,
      nom: '', prenom: '', telephone: '', email: '', adresse: '',
      specialite: '', tarifJournalier: 0, actif: true
    });
    this.expertsEditMode.set(true);
  }

  saveExpertInlineEdit(): void {
    const temp = this.tempExpert();
    if (!temp) return;
    const request = temp.idPrestataire
      ? this.prestataireService.update(temp.idPrestataire, temp as Prestataire)
      : this.prestataireService.create(temp as Prestataire);
    this.loadingExpert.set(true);
    request.subscribe({
      next: () => {
        this.loadingExpert.set(false);
        this.loadTabData('EXPERT');
        this.cancelExpertInlineEdit();
        this.showNotification('Expert sauvegardé', 'success');
      },
      error: () => {
        this.loadingExpert.set(false);
        this.showNotification('Erreur sauvegarde', 'error');
      }
    });
  }

  cancelExpertInlineEdit(): void {
    this.expertsEditId.set(null);
    this.tempExpert.set(null);
    this.expertsEditMode.set(false);
  }

  applyExpertFilter() { this.applyFilter('EXPERT'); }

  
  startHuissierInlineEdit(p?: Prestataire): void {
    this.huissiersEditId.set(p?.idPrestataire || 0);
    this.tempHuissier.set(p ? { ...p } : {
      typePrestataire: 'HUISSIER' as const,
      nom: '', prenom: '', telephone: '', email: '', adresse: '',
      specialite: '', tarifJournalier: 0, actif: true
    });
    this.huissiersEditMode.set(true);
  }

  saveHuissierInlineEdit(): void {
    const temp = this.tempHuissier();
    if (!temp) return;
    const request = temp.idPrestataire
      ? this.prestataireService.update(temp.idPrestataire, temp as Prestataire)
      : this.prestataireService.create(temp as Prestataire);
    this.loadingHuissier.set(true);
    request.subscribe({
      next: () => {
        this.loadingHuissier.set(false);
        this.loadTabData('HUISSIER');
        this.cancelHuissierInlineEdit();
        this.showNotification('Huissier sauvegardé', 'success');
      },
      error: () => {
        this.loadingHuissier.set(false);
        this.showNotification('Erreur sauvegarde', 'error');
      }
    });
  }

  cancelHuissierInlineEdit(): void {
    this.huissiersEditId.set(null);
    this.tempHuissier.set(null);
    this.huissiersEditMode.set(false);
  }

  applyHuissierFilter() { this.applyFilter('HUISSIER'); }

  
  openDialog(type: TypePrestataire, prestataire?: Prestataire): void {
    switch (type) {
      case 'AVOCAT':
        this.startAvocatInlineEdit(prestataire);
        break;
      case 'EXPERT':
        this.startExpertInlineEdit(prestataire);
        break;
      case 'HUISSIER':
        this.startHuissierInlineEdit(prestataire);
        break;
    }
  }

  toggleStatus(p: Prestataire): void {
    if (confirm(`Confirmer changement statut ${this.getFullName(p)} ?`)) {
      this.prestataireService.updateStatus(p.idPrestataire!, !p.actif).subscribe({
        next: () => this.loadTabData(p.typePrestataire),
        error: () => this.showNotification('Erreur statut', 'error')
      });
    }
  }

  confirmDelete(p: Prestataire): void {
    if (confirm(`Supprimer ${this.getFullName(p)} ?`)) {
      this.prestataireService.delete(p.idPrestataire!).subscribe({
        next: () => this.loadTabData(p.typePrestataire),
        error: () => this.showNotification('Erreur suppression', 'error')
      });
    }
  }

  getFullName(p: Prestataire): string {
    return `${p.prenom || ''} ${p.nom || ''}`.trim();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  showNotification(msg: string, type: 'success' | 'error' | 'info'): void {
    const panelClass = type === 'success' ? 'success-snackbar' : 
                      type === 'error' ? 'error-snackbar' : 'info-snackbar';
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass });
  }
}

