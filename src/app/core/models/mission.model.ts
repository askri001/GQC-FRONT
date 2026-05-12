export interface Mission {
  id?: number;
  typeMission: TypeMission;
  dateDebut: Date;
  dateFin?: Date;
  statut: StatutMission;
  resultat?: string;
  commentaire?: string;
  commentaireRejet?: string;
  dossierId?: number;
  affaireId?: number;
  prestataireId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  prestataire?: any;
  dossier?: any;
}

export type TypeMission = 'EXECUTION' | 'EXPERTISE';
export type StatutMission = 'EN_ATTENTE' | 'EN_COURS' | 'EN_ATTENTE_VALIDATION' | 'TERMINEE' | 'ANNULEE';

export const TYPE_MISSION_LABELS: Record<TypeMission, string> = {
  'EXECUTION': 'Exécution',
  'EXPERTISE': 'Expertise',
};

export const STATUT_MISSION_LABELS: Record<StatutMission, string> = {
  'EN_ATTENTE': 'En Attente',
  'EN_COURS': 'En Cours',
  'EN_ATTENTE_VALIDATION': 'En Attente de Validation',
  'TERMINEE': 'Terminée',
  'ANNULEE': 'Annulée'
};
