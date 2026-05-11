export interface Facture {
  id?: number;
  idFacture?: number;
  numero: string;
  dateEmission: Date;
  dateEcheance?: Date;
  montant: number;
  statut: StatutFacture;
  typeFacture: TypeFacture;
  missionId?: number;
  dossierId?: number;
  mission?: any;
}

export type StatutFacture =
  | 'EN_ATTENTE_VALIDATION'
  | 'VALIDEE'
  | 'PAYEE'
  | 'REJETEE'
  | 'EN_RETARD';

export type TypeFacture =
  | 'HONORAIRES'
  | 'FRAIS'
  | 'EXPERTISE'
  | 'AUTRE';

export const STATUT_FACTURE_LABELS: Record<StatutFacture, string> = {
  EN_ATTENTE_VALIDATION: 'En Attente de Validation',
  VALIDEE: 'Validée',
  PAYEE: 'Payée',
  REJETEE: 'Rejetée',
  EN_RETARD: 'En Retard'
};

export const TYPE_FACTURE_LABELS: Record<TypeFacture, string> = {
  HONORAIRES: 'Honoraires',
  FRAIS: 'Frais',
  EXPERTISE: 'Expertise',
  AUTRE: 'Autre'
};
