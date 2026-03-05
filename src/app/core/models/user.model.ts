export interface User {
  id?: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  active: boolean;
  roles: Role[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Role {
  id?: number;
  name: string;
  description?: string;
  permissions: Permission[];
  active?: boolean;
}

export interface Permission {
  id?: number;
  name: string;
  code: string;
  description?: string;
  module: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export type UserRole = 'ADMINISTRATEUR' | 'CHARGE_DOSSIER' | 'RESPONSABLE_CONTENTIEUX' | 'PRESTATAIRE_EXTERNE';

export const ROLE_LABELS: Record<UserRole, string> = {
  'ADMINISTRATEUR': 'Administrateur',
  'CHARGE_DOSSIER': 'Chargé de Dossier',
  'RESPONSABLE_CONTENTIEUX': 'Responsable Contentieux',
  'PRESTATAIRE_EXTERNE': 'Prestataire Externe'
};

