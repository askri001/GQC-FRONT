export interface Client {
  id?: number;
  nom: string;
  prenom: string;
  tel: string;
  adresse: string;
  cin: string;
  email?: string;
  dateCreation: Date;
  active?: boolean;
}

export interface ClientSearch {
  nom?: string;
  prenom?: string;
  cin?: string;
  tel?: string;
}

