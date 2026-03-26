export interface Facture {
  id?: number;
  numero: string;
  dateEmission: Date;
  montant: number;
  statut: StatutFacture;
  typeFacture: TypeFacture;
  missionId?: number;
  dossierId?: number;
  prestataireId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  mission?: any;
  dossier?: any;
  prestataire?: any;
}

export type StatutFacture = 'EN_ATTENTE' | 'VALIDEE' | 'PAYEE' | 'REJETEE';
export type TypeFacture = 'HONORAIRES' | 'FRAIS' | 'EXPERTISE' | 'AUTRE';

export const STATUT_FACTURE_LABELS: Record<StatutFacture, string> = {
  'EN_ATTENTE': 'En Attente',
  'VALIDEE': 'Validée',
  'PAYEE': 'Payée',
  'REJETEE': 'Rejetée'
};

export const TYPE_FACTURE_LABELS: Record<TypeFacture, string> = {
  'HONORAIRES': 'Honoraires',
  'FRAIS': 'Frais',
  'EXPERTISE': 'Expertise',
  'AUTRE': 'Autre'
};


