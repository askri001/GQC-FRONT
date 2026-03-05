export interface Dossier {
  id?: number;
  reference: string;
  dateOuverture: Date;
  statut: DossierStatut;
  niveauRisque: NiveauRisque;
  dateCloture?: Date;
  montantInitial: number;
  montantRecupere: number;
  clientId: number;
  client?: {
    id?: number;
    nom: string;
    prenom: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export type DossierStatut = 'EN_COURS' | 'CLOTURE' | 'SUSPENDU' | 'TRANSFERE' | 'EN_ATTENTE';
export type NiveauRisque = 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';

export const DOSSIER_STATUT_LABELS: Record<DossierStatut, string> = {
  'EN_COURS': 'En Cours',
  'CLOTURE': 'Clôturé',
  'SUSPENDU': 'Suspendu',
  'TRANSFERE': 'Transféré',
  'EN_ATTENTE': 'En Attente'
};

export const NIVEAU_RISQUE_LABELS: Record<NiveauRisque, string> = {
  'FAIBLE': 'Faible',
  'MOYEN': 'Moyen',
  'ELEVE': 'Élevé',
  'CRITIQUE': 'Critique'
};

