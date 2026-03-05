export interface DashboardStats {
  totalDossiers: number;
  dossiersActifs: number;
  dossiersClotures: number;
  montantTotalRecupere: number;
  montantTotalImpaye: number;
  tauxRecouvrement: number;
  missionsEnCours: number;
  missionsTerminees: number;
  facturesEnAttente: number;
  facturesPayees: number;
  prestatairesActifs: number;
  clientsActifs: number;
}

export interface DossierStatusCount {
  statut: string;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  dossiersOuverts: number;
  dossiersClos: number;
  montantRecupere: number;
}

export interface PrestatairePerformance {
  prestataireId: number;
  nom: string;
  missionsTerminees: number;
  tauxCompletion: number;
  averageRating?: number;
}

