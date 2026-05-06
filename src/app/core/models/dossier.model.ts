export interface Dossier {
  id?: number;
  idDossier?: number;
  reference: string;
  dateOuverture: Date;
  statut: 'EN_COURS' | 'CLOTURE' | 'SUSPENDU' | 'TRANSFERE' | 'EN_ATTENTE' | 'OUVERT' | 'VALIDE';
  niveauRisque: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';
  dateCloture?: Date;
  montantInitial: number;
  montantRecupere: number;
  clientId: number;
  chargeDossierId?: number;
}

export const DOSSIER_STATUT_LABELS = {
  OUVERT: 'Ouvert',
  EN_COURS: 'En Cours',
  VALIDE: 'Validé',
  CLOTURE: 'Clôturé',
  SUSPENDU: 'Suspendu',
  TRANSFERE: 'Transféré',
  EN_ATTENTE: 'En Attente'
} as const;

export const NIVEAU_RISQUE_LABELS = {
  FAIBLE: 'Faible',
  MOYEN: 'Moyen',
  ELEVE: 'Élevé',
  CRITIQUE: 'Critique'
} as const;

