export interface Risque {
  id?: number;
  montantPrincipal: number;
  montantInteret: number;
  montantTotal: number;
  dateContrat: Date;
  dateEcheance: Date;
  tauxInteret: number;
  dossierId: number;
  actif?: boolean;
}

