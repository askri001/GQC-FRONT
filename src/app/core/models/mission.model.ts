export interface Mission {
  id?: number;
  typeMission: TypeMission;
  dateDebut: Date;
  dateFin?: Date;
  statut: StatutMission;
  resultat?: string;
  dossierId?: number;
  prestataireId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  prestataire?: any;
  dossier?: any;
}

export type TypeMission = 'SIGNIFICATION' | 'EXpertise' | 'DEFENSE' | 'RECOUVREMENT' | 'CONSULTATION';
export type StatutMission = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export const TYPE_MISSION_LABELS: Record<TypeMission, string> = {
  'SIGNIFICATION': 'Signification',
  'EXpertise': 'Expertise',
  'DEFENSE': 'Défense',
  'RECOUVREMENT': 'Recouvrement',
  'CONSULTATION': 'Consultation'
};

export const STATUT_MISSION_LABELS: Record<StatutMission, string> = {
  'EN_ATTENTE': 'En Attente',
  'EN_COURS': 'En Cours',
  'TERMINEE': 'Terminée',
  'ANNULEE': 'Annulée'
};

