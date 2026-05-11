export interface Dossier {
  id?: number;
  idDossier?: number;
  reference: string;
  dateOuverture: Date;
  statut: 'EN_COURS' | 'CLOTURE' | 'SUSPENDU' | 'TRANSFERE' | 'EN_ATTENTE_VALIDATION' | 'OUVERT' | 'VALIDE';
  niveauRisque: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';
  dateCloture?: Date;
  montantInitial: number;
  montantRecupere: number;
  clientId: number;
  clientNom?: string;
  clientPrenom?: string;
  chargeDossierId?: number;
  chargeDossierNom?: string;
  chargeDossierPrenom?: string;
}

export const DOSSIER_STATUT_LABELS = {
  OUVERT: 'Ouvert',
  EN_COURS: 'En Cours',
  VALIDE: 'Validé',
  CLOTURE: 'Clôturé',
  SUSPENDU: 'Suspendu',
  TRANSFERE: 'Transféré',
  EN_ATTENTE_VALIDATION: 'En Attente de Validation'
} as const;

export const NIVEAU_RISQUE_LABELS = {
  FAIBLE: 'Faible',
  MOYEN: 'Moyen',
  ELEVE: 'Élevé',
  CRITIQUE: 'Critique'
} as const;

