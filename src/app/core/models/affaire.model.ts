import { Audience } from './audience.model';

export interface Affaire {
  id?: number;
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

export type StatutAffaire = 'EN_COURS' | 'JUGEE' | 'RECOUR' | 'CLOTURE' | 'SUSPENDUE';

export const STATUT_AFFAIRE_LABELS: Record<StatutAffaire, string> = {
  'EN_COURS': 'En Cours',
  'JUGEE': 'Jugée',
  'RECOUR': 'Recours',
  'CLOTURE': 'Clôturée',
  'SUSPENDUE': 'Suspendue'
};

