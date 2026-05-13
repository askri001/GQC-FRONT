export interface Facture {
  id?: number;
  idFacture?: number;
  numero: string;
  dateEmission: Date;
  dateEcheance?: Date;
  datePaiement?: Date;
  montant: number;
  statut: StatutFacture;
  typeFacture: TypeFacture;
  typePaiement?: TypePaiement;
  missionId?: number;
  dossierId?: number;
  mission?: any;
  commentaireRejet?: string;
}

export type StatutFacture =
  | 'EN_ATTENTE_VALIDATION'
  | 'VALIDEE'
  | 'REJETEE'
  | 'PAYEE';

export type TypeFacture =
  | 'HONORAIRES'
  | 'FRAIS'
  | 'EXPERTISE'
  | 'AUTRE';

export type TypePaiement =
  | 'CHEQUE_BCT'
  | 'VIREMENT';

export const STATUT_FACTURE_LABELS: Record<StatutFacture, string> = {
  EN_ATTENTE_VALIDATION: 'En Attente de Validation',
  VALIDEE:               'Validée',
  REJETEE:               'Rejetée',
  PAYEE:                 'Payée',
};

export const TYPE_FACTURE_LABELS: Record<TypeFacture, string> = {
  HONORAIRES: 'Honoraires',
  FRAIS:      'Frais',
  EXPERTISE:  'Expertise',
  AUTRE:      'Autre',
};

export const TYPE_PAIEMENT_LABELS: Record<TypePaiement, string> = {
  CHEQUE_BCT: 'Chèque BCT',
  VIREMENT:   'Virement',
};
