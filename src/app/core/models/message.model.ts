export interface Message {
  id?: number;
  fromUserId?: number;
  fromUsername?: string;
  fromNom?: string;
  fromPrenom?: string;
  toUserId?: number;
  toUsername?: string;
  subject: string;
  body: string;
  entityType?: 'DOSSIER' | 'AFFAIRE' | 'MISSION' | 'FACTURE';
  entityId?: number;
  read?: boolean;
  createdAt?: Date;
}
