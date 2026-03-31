export interface Prestataire {
  idPrestataire?: number;
  typePrestataire: TypePrestataire;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  specialite: string;
  tarifJournalier: number;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TypePrestataire = 'HUISSIER' | 'EXPERT' | 'AVOCAT';

export const TYPE_PRESTATAIRE_LABELS: Record<TypePrestataire, string> = {
  'HUISSIER': 'Huissier',
  'EXPERT': 'Expert',
  'AVOCAT': 'Avocat'
};

export const PRESTATAIRE_SPECIALITES: Record<TypePrestataire, string[]> = {
  'HUISSIER': ['Signification', 'Exécution', 'Saisie'],
  'EXPERT': ['Comptable', 'Judiciaire', 'Bâtiment', 'Médical'],
  'AVOCAT': ['Civil', 'Pénal', 'Commercial', 'Travail']
};

