export interface Client {
  id?: number;
  nom: string;
  prenom: string;
  cin: string;
  tel: string;
  email?: string;
  adresse?: string;
  active?: boolean;
  dateCreation?: string | Date;
}
