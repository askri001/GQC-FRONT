export interface Client {
  id?: number;
  nom: string;
  prenom?: string;
  typeClient: 'PHYSIQUE' | 'MORALE';
  tel: string;
  email?: string;
  adresse?: string;
  cin?: string;
  rne?: string;
  active: boolean;
}
