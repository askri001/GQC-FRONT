export interface Risque {
  id?: number;
  montantPrincipal: number;
  montantInteret: number;
  montantTotal: number;
  tauxInteret: number;
  periode?: string;
  dateContrat: Date;
  dateDeblocage?: Date;
  dateEcheance: Date;
  dossierId: number;
  actif?: boolean;
}

