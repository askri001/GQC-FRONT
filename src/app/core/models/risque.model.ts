export interface Risque {
  id?: number;
  reference?: string;
  montantPrincipal: number;
  montantInteret: number;
  montantTotal: number;
  tauxInteret: number;
  periode?: number;
  dateContrat: Date;
  dateDeblocage?: Date;
  dateEcheance: Date;
  dossierId: number;
  actif?: boolean;
}

