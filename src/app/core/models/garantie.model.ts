export interface Garantie {
  id?: number;
  typeGarantie: TypeGarantie;
  description: string;
  valeur: number;
  statut: StatutGarantie;
  dossierId: number;
  actif?: boolean;
}

export type TypeGarantie = 'HYPOTHEQUE' | 'GAGE' | 'CAUTION' | 'ASSURANCE' | 'AUTRE';
export type StatutGarantie = 'ACTIVE' | 'REALISEE' | 'EXPIREE' | 'INVALIDEE';

export const TYPE_GARANTIE_LABELS: Record<TypeGarantie, string> = {
  'HYPOTHEQUE': 'Hypothèque',
  'GAGE': 'Gage',
  'CAUTION': 'Caution',
  'ASSURANCE': 'Assurance',
  'AUTRE': 'Autre'
};

export const STATUT_GARANTIE_LABELS: Record<StatutGarantie, string> = {
  'ACTIVE': 'Active',
  'REALISEE': 'Réalisée',
  'EXPIREE': 'Expirée',
  'INVALIDEE': 'Invalidée'
};

