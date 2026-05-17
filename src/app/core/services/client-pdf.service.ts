import { Injectable, inject } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

import { Client } from '../models/client.model';
import { Dossier, DOSSIER_STATUT_LABELS, NIVEAU_RISQUE_LABELS } from '../models/dossier.model';
import { Risque } from '../models/risque.model';
import { Garantie, TYPE_GARANTIE_LABELS, STATUT_GARANTIE_LABELS } from '../models/garantie.model';
import { Affaire, STATUT_AFFAIRE_LABELS } from '../models/affaire.model';

import { DossierService } from './dossier.service';
import { RisqueService } from './risque.service';
import { GarantieService } from './garantie.service';
import { AffaireService } from './affaire.service';
import { BNA_LOGO_BASE64 } from './bna-logo';

export interface ClientPdfData {
  client:    Client;
  dossiers:  Dossier[];
  risques:   Risque[];
  garanties: Garantie[];
  affaires:  Affaire[];
}

@Injectable({ providedIn: 'root' })
export class ClientPdfService {

  private dossierService  = inject(DossierService);
  private risqueService   = inject(RisqueService);
  private garantieService = inject(GarantieService);
  private affaireService  = inject(AffaireService);

  // ── Load all related data for a client ───────────────────────
  loadClientData(client: Client): Observable<ClientPdfData> {
    const clientId = client.id!;

    return this.dossierService.getByClientId(clientId).pipe(
      catchError(() => of([] as Dossier[])),
      switchMap((dossiers) => {
        if (!dossiers.length) {
          return of({ client, dossiers: [], risques: [], garanties: [], affaires: [] });
        }

        const dossierIds = dossiers.map(d => d.id ?? d.idDossier!).filter(Boolean);

        // Load risques + affaires for all dossiers in parallel
        const risques$  = forkJoin(dossierIds.map(id =>
          this.risqueService.getByDossierId(id).pipe(catchError(() => of([] as Risque[])))
        )).pipe(map(arrays => arrays.flat()));

        const affaires$ = forkJoin(dossierIds.map(id =>
          this.affaireService.getByDossierId(id).pipe(catchError(() => of([] as Affaire[])))
        )).pipe(map(arrays => arrays.flat()));

        return forkJoin({ risques: risques$, affaires: affaires$ }).pipe(
          switchMap(({ risques, affaires }) => {
            if (!risques.length) {
              return of({ client, dossiers, risques: [], garanties: [], affaires });
            }
            // Load garanties for all risques in parallel
            const risqueIds = risques.map(r => r.id!).filter(Boolean);
            return forkJoin(risqueIds.map(id =>
              this.garantieService.getByRisqueId(id).pipe(catchError(() => of([] as Garantie[])))
            )).pipe(
              map(arrays => ({
                client,
                dossiers,
                risques,
                garanties: arrays.flat(),
                affaires,
              }))
            );
          })
        );
      })
    );
  }

  // ── Generate PDF ─────────────────────────────────────────────
  async generatePdf(data: ClientPdfData): Promise<void> {
    const { jsPDF } = await import('jspdf');

    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const ml    = 14;
    const mr    = 14;
    const cw    = pageW - ml - mr;

    // ── Color palette ─────────────────────────────────────────
    const G:  [number,number,number] = [0,   150, 110];
    const GD: [number,number,number] = [0,    90,  65];
    const GB: [number,number,number] = [235, 248, 243];
    const GL: [number,number,number] = [190, 225, 210];
    const DK: [number,number,number] = [35,   50,  45];
    const GR: [number,number,number] = [105, 125, 120];
    const LN: [number,number,number] = [215, 232, 226];
    const WH: [number,number,number] = [255, 255, 255];
    const RD: [number,number,number] = [180,  30,  30];
    const BL: [number,number,number] = [25,  100, 185];

    const sf = (c: [number,number,number]) => doc.setFillColor(c[0], c[1], c[2]);
    const ss = (c: [number,number,number]) => doc.setDrawColor(c[0], c[1], c[2]);
    const st = (c: [number,number,number]) => doc.setTextColor(c[0], c[1], c[2]);
    const B  = (sz: number) => { doc.setFont('helvetica', 'bold');   doc.setFontSize(sz); };
    const N  = (sz: number) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(sz); };

    const pad     = (n: number) => String(n).padStart(2, '0');
    const fmtDate = (d: any): string => {
      if (!d) return '-';
      try {
        const dt = new Date(d);
        return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear()}`;
      } catch { return '-'; }
    };
    const safe = (v: any): string => (v !== null && v !== undefined && String(v).trim() !== '') ? String(v) : '-';
    const fmtNum = (n: any): string => {
      const num = Number(n);
      return isNaN(num) ? '-' : num.toFixed(3) + ' DT';
    };

    let y        = 0;
    let pageNum  = 1;
    const footer = () => {
      sf(G);  doc.rect(0, pageH - 16, pageW, 16, 'F');
      sf(GD); doc.rect(0, pageH - 16, 4, 16, 'F');
      st(WH); N(7);
      doc.text('Banque Nationale Agricole (BNA) - Siege Social : Avenue Mohamed V, Tunis 1002, Tunisie',
        pageW / 2, pageH - 8, { align: 'center' });
      const now = new Date();
      doc.text(
        `Genere le ${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} - Confidentiel`,
        pageW / 2, pageH - 3, { align: 'center' });
      doc.text(`Page ${pageNum}`, pageW - mr, pageH - 3, { align: 'right' });
    };

    const checkPageBreak = (needed: number) => {
      if (y + needed > pageH - 22) {
        footer();
        doc.addPage();
        pageNum++;
        y = 14;
      }
    };

    // ── HEADER ────────────────────────────────────────────────
    const headerH = 54;
    const hPad    = 4;

    sf(WH); doc.rect(0, 0, pageW, pageH, 'F');
    sf(WH); ss(G); doc.setLineWidth(1.5);
    doc.roundedRect(ml, hPad, cw, headerH, 3, 3, 'FD');

    const logoW = 46;
    const logoH = logoW * 377 / 696;
    const logoX = ml + 8;
    const logoY = hPad + (headerH - logoH) / 2;
    doc.addImage(BNA_LOGO_BASE64, 'PNG', logoX, logoY, logoW, logoH);

    ss(GL); doc.setLineWidth(0.5);
    doc.line(logoX + logoW + 8, hPad + 6, logoX + logoW + 8, hPad + headerH - 6);

    const infoX = logoX + logoW + 14;
    const infoY = hPad + headerH / 2 - 9;
    st(DK); B(12);
    doc.text('Banque Nationale Agricole', infoX, infoY);
    st(GR); N(8.5);
    doc.text('Gestion des Contentieux - Recouvrement', infoX, infoY + 7);
    st(GR); N(7.5);
    doc.text('Avenue Mohamed V, Tunis 1002, Tunisie', infoX, infoY + 13);

    st(G); B(22);
    doc.text('FICHE CLIENT', pageW - mr - 6, infoY + 4, { align: 'right' });

    // Active badge
    const badgeW = 28;
    const badgeX = pageW - mr - badgeW - 6;
    const badgeY = hPad + headerH - 13;
    sf(data.client.active ? G : RD);
    doc.roundedRect(badgeX, badgeY, badgeW, 8, 2, 2, 'F');
    st(WH); B(8);
    doc.text(data.client.active ? 'ACTIF' : 'INACTIF', badgeX + badgeW / 2, badgeY + 5.5, { align: 'center' });

    y = hPad + headerH + 10;

    // ── SECTION HELPER ────────────────────────────────────────
    const section = (title: string) => {
      checkPageBreak(14);
      y += 3;
      sf(G);  doc.rect(ml, y, 3.5, 7, 'F');
      sf(GB); doc.rect(ml + 3.5, y, cw - 3.5, 7, 'F');
      st(G); B(8.5);
      doc.text(title, ml + 7, y + 5);
      y += 11;
    };

    const row = (label: string, value: string, vc: [number,number,number] = DK, bold = false) => {
      checkPageBreak(9);
      st(GR); N(8);
      doc.text(label, ml + 4, y);
      st(vc);
      bold ? B(8.5) : N(8.5);
      doc.text(safe(value), ml + 68, y, { maxWidth: cw - 72 });
      doc.setFont('helvetica', 'normal');
      ss(LN); doc.setLineWidth(0.2);
      doc.line(ml + 4, y + 2, ml + cw - 4, y + 2);
      y += 8;
    };

    const row2 = (l1: string, v1: string, l2: string, v2: string) => {
      checkPageBreak(9);
      const half = cw / 2 - 2;
      st(GR); N(8);
      doc.text(l1, ml + 4, y);
      doc.text(l2, ml + 4 + half, y);
      st(DK); N(8.5);
      doc.text(safe(v1), ml + 36, y, { maxWidth: half - 36 });
      doc.text(safe(v2), ml + 36 + half, y, { maxWidth: half - 36 });
      ss(LN); doc.setLineWidth(0.2);
      doc.line(ml + 4, y + 2, ml + cw - 4, y + 2);
      y += 8;
    };

    const emptyMsg = () => {
      checkPageBreak(10);
      st(GR); N(8);
      doc.text('Aucune donnee disponible', ml + 4, y);
      y += 10;
    };

    // ── TABLE HELPER ──────────────────────────────────────────
    const tableHeader = (cols: { label: string; w: number }[]) => {
      checkPageBreak(10);
      sf(G); doc.rect(ml, y, cw, 8, 'F');
      st(WH); B(7.5);
      let x = ml + 2;
      for (const col of cols) {
        doc.text(col.label, x, y + 5.5, { maxWidth: col.w - 2 });
        x += col.w;
      }
      y += 8;
    };

    const tableRow = (
      cols: { label: string; w: number }[],
      values: string[],
      even: boolean
    ) => {
      checkPageBreak(8);
      if (even) { sf(GB); doc.rect(ml, y, cw, 7, 'F'); }
      st(DK); N(7.5);
      let x = ml + 2;
      for (let i = 0; i < cols.length; i++) {
        doc.text(safe(values[i]), x, y + 5, { maxWidth: cols[i].w - 3 });
        x += cols[i].w;
      }
      ss(LN); doc.setLineWidth(0.15);
      doc.line(ml, y + 7, ml + cw, y + 7);
      y += 7;
    };

    const c = data.client;

    // ═══════════════════════════════════════════════════════════
    // SECTION 1 — INFORMATIONS CLIENT
    // ═══════════════════════════════════════════════════════════
    section('INFORMATIONS CLIENT');
    row2('Nom', safe(c.nom), 'Prenom', safe(c.prenom));
    row2('Type', c.typeClient === 'PHYSIQUE' ? 'Particulier' : 'Entreprise',
         c.typeClient === 'PHYSIQUE' ? 'CIN' : 'RNE',
         safe(c.typeClient === 'PHYSIQUE' ? c.cin : c.rne));
    row2('Telephone', safe(c.tel), 'Email', safe(c.email));
    row('Adresse', safe(c.adresse));
    row('Statut', c.active ? 'Actif' : 'Inactif', c.active ? G : RD, true);

    // ═══════════════════════════════════════════════════════════
    // SECTION 2 — DOSSIERS
    // ═══════════════════════════════════════════════════════════
    section(`DOSSIERS (${data.dossiers.length})`);
    if (!data.dossiers.length) {
      emptyMsg();
    } else {
      const dCols = [
        { label: 'REFERENCE',      w: 38 },
        { label: 'DATE OUVERTURE', w: 34 },
        { label: 'STATUT',         w: 38 },
        { label: 'RISQUE',         w: 26 },
        { label: 'MT INITIAL',     w: 30 },
        { label: 'MT RECUPERE',    w: 16 },
      ];
      tableHeader(dCols);
      data.dossiers.forEach((d, i) => {
        tableRow(dCols, [
          safe(d.reference),
          fmtDate(d.dateOuverture),
          DOSSIER_STATUT_LABELS[d.statut] ?? safe(d.statut),
          NIVEAU_RISQUE_LABELS[d.niveauRisque] ?? safe(d.niveauRisque),
          fmtNum(d.montantInitial),
          fmtNum(d.montantRecupere),
        ], i % 2 === 0);
      });
      y += 3;
    }

    // ═══════════════════════════════════════════════════════════
    // SECTION 3 — RISQUES
    // ═══════════════════════════════════════════════════════════
    section(`RISQUES (${data.risques.length})`);
    if (!data.risques.length) {
      emptyMsg();
    } else {
      const rCols = [
        { label: 'REFERENCE',    w: 32 },
        { label: 'DATE CONTRAT', w: 30 },
        { label: 'DATE ECHEANCE',w: 30 },
        { label: 'MT PRINCIPAL', w: 30 },
        { label: 'MT INTERET',   w: 28 },
        { label: 'MT TOTAL',     w: 32 },
      ];
      tableHeader(rCols);
      data.risques.forEach((r, i) => {
        tableRow(rCols, [
          safe(r.reference),
          fmtDate(r.dateContrat),
          fmtDate(r.dateEcheance),
          fmtNum(r.montantPrincipal),
          fmtNum(r.montantInteret),
          fmtNum(r.montantTotal),
        ], i % 2 === 0);
      });
      y += 3;
    }

    // ═══════════════════════════════════════════════════════════
    // SECTION 4 — GARANTIES
    // ═══════════════════════════════════════════════════════════
    section(`GARANTIES (${data.garanties.length})`);
    if (!data.garanties.length) {
      emptyMsg();
    } else {
      const gCols = [
        { label: 'TYPE',        w: 36 },
        { label: 'DESCRIPTION', w: 60 },
        { label: 'VALEUR',      w: 34 },
        { label: 'STATUT',      w: 52 },
      ];
      tableHeader(gCols);
      data.garanties.forEach((g, i) => {
        tableRow(gCols, [
          TYPE_GARANTIE_LABELS[g.typeGarantie] ?? safe(g.typeGarantie),
          safe(g.description),
          fmtNum(g.valeur),
          STATUT_GARANTIE_LABELS[g.statut] ?? safe(g.statut),
        ], i % 2 === 0);
      });
      y += 3;
    }

    // ═══════════════════════════════════════════════════════════
    // SECTION 5 — AFFAIRES
    // ═══════════════════════════════════════════════════════════
    section(`AFFAIRES (${data.affaires.length})`);
    if (!data.affaires.length) {
      emptyMsg();
    } else {
      const aCols = [
        { label: 'N PROCEDURE', w: 40 },
        { label: 'DATE DEBUT',  w: 30 },
        { label: 'TRIBUNAL',    w: 60 },
        { label: 'STATUT',      w: 52 },
      ];
      tableHeader(aCols);
      data.affaires.forEach((a, i) => {
        tableRow(aCols, [
          safe(a.numeroProcedure),
          fmtDate(a.dateDebut),
          safe(a.tribunal),
          STATUT_AFFAIRE_LABELS[a.statut] ?? safe(a.statut),
        ], i % 2 === 0);
      });
      y += 3;
    }

    // ── FOOTER last page ──────────────────────────────────────
    footer();

    doc.save(`FicheClient_BNA_${c.nom}${c.prenom ? '_' + c.prenom : ''}.pdf`);
  }
}
