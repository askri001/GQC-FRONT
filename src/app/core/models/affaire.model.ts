import { Audience } from './audience.model';

export interface Affaire {
  idAffaire?: number;
  numeroProcedure: string;
  dateDebut: Date;
  statut: StatutAffaire;
  tribunal: string;
  jugement?: string;
  dossierId: number;
  createdAt?: Date;
  updatedAt?: Date;
  audiences?: Audience[];
}

export type StatutAffaire = 'INITIEE' | 'EN_COURS' | 'JUGEMENT_RENDU' | 'TERMINEE';

export const STATUT_AFFAIRE_LABELS: Record<StatutAffaire, string> = {
  'INITIEE': 'Initiée',
  'EN_COURS': 'En Cours',
  'JUGEMENT_RENDU': 'Jugement Rendu',
  'TERMINEE': 'Terminée'
};

