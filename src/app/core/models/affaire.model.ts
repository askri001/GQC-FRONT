import { Audience } from './audience.model';

export interface Affaire {
  id?: number;
  idAffaire?: number;
  numeroProcedure: string;
  dateDebut: Date;
  statut: StatutAffaire;
  tribunal: string;
  jugement?: string;
  dossierId: number;
  prestataireId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  audiences?: Audience[];
  commentaireRejet?: string;
}

export type StatutAffaire = 'INITIEE' | 'EN_COURS' | 'JUGEMENT_RENDU' | 'EN_ATTENTE_VALIDATION' | 'TERMINEE';

export const STATUT_AFFAIRE_LABELS: Record<StatutAffaire, string> = {
  'INITIEE': 'Initiée',
  'EN_COURS': 'En Cours',
  'JUGEMENT_RENDU': 'Jugement Rendu',
  'EN_ATTENTE_VALIDATION': 'En Attente de Validation',
  'TERMINEE': 'Terminée'
};

