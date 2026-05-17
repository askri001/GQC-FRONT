import { Injectable } from '@angular/core';
import { Facture } from '../models/facture.model';
import { BNA_LOGO_BASE64 } from './bna-logo';

export interface PdfFactureData {
  facture:           Facture;
  prestataireNom:    string;
  prestatairePrenom: string;
  prestataireType:   string;
  prestataireRib:    string;
  missionLabel:      string;
  affaireNumero:     string;
  affaireTribunal:   string;
  dossierRef:        string;
  clientNom?:        string;
}

@Injectable({ providedIn: 'root' })
export class FacturePdfService {

  async generatePdf(data: PdfFactureData): Promise<void> {
    const { jsPDF } = await import('jspdf');

    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const ml    = 14;
    const mr    = 14;
    const cw    = pageW - ml - mr;

    // ── Color palette ─────────────────────────────────────────────
    const G:  [number,number,number] = [0,   150, 110];  // BNA green
    const GD: [number,number,number] = [0,    90,  65];  // dark green
    const GB: [number,number,number] = [235, 248, 243];  // green bg
    const GL: [number,number,number] = [190, 225, 210];  // green line
    const DK: [number,number,number] = [35,   50,  45];  // dark text
    const GR: [number,number,number] = [105, 125, 120];  // grey text
    const LN: [number,number,number] = [215, 232, 226];  // light line
    const WH: [number,number,number] = [255, 255, 255];  // white
    const BL: [number,number,number] = [25,  100, 185];  // blue

    const sf = (c: [number,number,number]) => doc.setFillColor(c[0], c[1], c[2]);
    const ss = (c: [number,number,number]) => doc.setDrawColor(c[0], c[1], c[2]);
    const st = (c: [number,number,number]) => doc.setTextColor(c[0], c[1], c[2]);
    const B  = (sz: number) => { doc.setFont('helvetica', 'bold');   doc.setFontSize(sz); };
    const N  = (sz: number) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(sz); };

    // ── Date formatters — NO locale to avoid encoding issues ──────
    const pad = (n: number) => String(n).padStart(2, '0');

    const fmtDate = (d: any): string => {
      if (!d) return '-';
      try {
        const dt = new Date(d);
        return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear()}`;
      } catch { return '-'; }
    };

    const fmtDateTime = (d: any): string => {
      if (!d) return '-';
      try {
        const dt = new Date(d);
        return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      } catch { return '-'; }
    };

    const modePaiement = (tp: string | undefined): string => {
      if (tp === 'CHEQUE_BCT') return 'Cheque BCT';
      if (tp === 'VIREMENT')   return 'Virement Bancaire';
      return '-';
    };

    const safe = (v: string | undefined | null): string =>
      (v && v !== '—' && v.trim() !== '') ? v : '-';

    const f = data.facture;

    // ═══════════════════════════════════════════════════════════════
    // HEADER — full green bordered frame
    // ═══════════════════════════════════════════════════════════════
    const headerH  = 56;
    const hPad     = 4;   // padding inside the frame

    // Page white background
    sf(WH); doc.rect(0, 0, pageW, headerH + 10, 'F');

    // Full green border frame — white fill inside, green stroke
    sf(WH); ss(G); doc.setLineWidth(1.5);
    doc.roundedRect(ml, hPad, cw, headerH, 3, 3, 'FD');

    // BNA logo — vertically centered inside frame
    const logoW = 48;
    const logoH = logoW * 377 / 696;
    const logoX = ml + 8;
    const logoY = hPad + (headerH - logoH) / 2;
    doc.addImage(BNA_LOGO_BASE64, 'PNG', logoX, logoY, logoW, logoH);

    // Vertical divider inside frame
    ss(GL); doc.setLineWidth(0.5);
    doc.line(logoX + logoW + 8, hPad + 6, logoX + logoW + 8, hPad + headerH - 6);

    // Bank info — vertically centered in frame
    const infoX = logoX + logoW + 14;
    const infoY = hPad + headerH / 2 - 8;
    st(DK); B(12);
    doc.text('Banque Nationale Agricole', infoX, infoY);
    st(GR); N(8.5);
    doc.text('Gestion des Contentieux - Recouvrement', infoX, infoY + 7);
    st(GR); N(7.5);
    doc.text('Avenue Mohamed V, Tunis 1002, Tunisie', infoX, infoY + 13);

    // FACTURE title — right side inside frame
    st(G); B(24);
    doc.text('FACTURE', pageW - mr - 6, infoY + 2, { align: 'right' });
    st(GR); N(9);
    doc.text(`N  ${f.numero}`, pageW - mr - 6, infoY + 10, { align: 'right' });

    // PAYEE badge — bottom right inside frame
    const badgeW = 30;
    const badgeX = pageW - mr - badgeW - 6;
    const badgeY = hPad + headerH - 13;
    sf(G); doc.roundedRect(badgeX, badgeY, badgeW, 9, 2, 2, 'F');
    st(WH); B(9);
    doc.text('PAYEE', badgeX + badgeW / 2, badgeY + 6.2, { align: 'center' });

    let y = hPad + headerH + 8;

    // ═══════════════════════════════════════════════════════════════
    // MONTANT BOX — compact, all content fits inside
    // ═══════════════════════════════════════════════════════════════
    const boxH = 42;   // increased to contain all 3 items without overflow
    const boxY = y;

    // Shadow effect (slightly offset darker rect)
    sf([200, 225, 215]); doc.roundedRect(ml + 1, boxY + 1, cw, boxH, 3, 3, 'F');

    // Main box
    sf(GB); ss(G); doc.setLineWidth(0.7);
    doc.roundedRect(ml, boxY, cw, boxH, 3, 3, 'FD');

    // Left section: MONTANT TOTAL — vertically centered in box
    const leftW = cw * 0.48;
    const leftCenterY = boxY + boxH / 2;

    st(GR); N(8.5);
    doc.text('MONTANT TOTAL', ml + 10, leftCenterY - 7);

    // Amount — large and bold
    st(G); B(22);
    doc.text(`${Number(f.montant ?? 0).toFixed(3)} DT`, ml + 10, leftCenterY + 5);

    // Vertical divider inside box — full inner height
    ss(GL); doc.setLineWidth(0.4);
    doc.line(ml + leftW, boxY + 5, ml + leftW, boxY + boxH - 5);

    // Right section: payment info — 2 rows evenly spaced inside box
    const rx2    = ml + leftW + 10;
    const rowGap = (boxH - 8) / 3;          // divide inner height into 3 equal slots
    const r1Y    = boxY + 4 + rowGap * 0;   // row 1 top
    const r2Y    = boxY + 4 + rowGap * 1;   // row 2 top

    // Row 1 — Mode de paiement
    st(GR); N(7.5);
    doc.text('Mode de paiement', rx2, r1Y + 4);
    st(DK); B(10);
    doc.text(modePaiement(f.typePaiement), rx2, r1Y + 10);

    // Row 2 — Date de paiement
    st(GR); N(7.5);
    doc.text('Date de paiement', rx2, r2Y + 4);
    st(BL); B(9);
    doc.text(fmtDateTime(f.datePaiement), rx2, r2Y + 10);

    y = boxY + boxH + 8;

    // ═══════════════════════════════════════════════════════════════
    // SECTION + ROW HELPERS
    // ═══════════════════════════════════════════════════════════════
    const section = (title: string) => {
      y += 3;
      sf(G);  doc.rect(ml, y, 3.5, 7, 'F');
      sf(GB); doc.rect(ml + 3.5, y, cw - 3.5, 7, 'F');
      st(G); B(8.5);
      doc.text(title, ml + 7, y + 5);
      y += 10;
    };

    const row = (
      label: string, value: string,
      vc: [number,number,number] = DK,
      vbold = false,
      mono  = false
    ) => {
      st(GR); N(8);
      doc.text(label, ml + 4, y);

      st(vc);
      if (mono) {
        doc.setFont('courier', vbold ? 'bold' : 'normal');
        doc.setFontSize(8.5);
      } else if (vbold) {
        B(8.5);
      } else {
        N(8.5);
      }
      // Truncate long values to avoid overflow
      const maxW = cw - 68 - 4;
      const val  = safe(value);
      doc.text(val, ml + 68, y, { maxWidth: maxW });
      doc.setFont('helvetica', 'normal');

      ss(LN); doc.setLineWidth(0.2);
      doc.line(ml + 4, y + 2, ml + cw - 4, y + 2);
      y += 8;
    };

    const row2 = (l1: string, v1: string, l2: string, v2: string) => {
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

    // ═══════════════════════════════════════════════════════════════
    // SECTION 1 — PRESTATAIRE
    // ═══════════════════════════════════════════════════════════════
    section('INFORMATIONS PRESTATAIRE');
    row2('Type',   safe(data.prestataireType),   'Prenom', safe(data.prestatairePrenom));
    row2('Nom',    safe(data.prestataireNom),     'Statut', 'Actif');
    row('RIB Bancaire', safe(data.prestataireRib), G, true, true);

    // ═══════════════════════════════════════════════════════════════
    // SECTION 2 — DOSSIER / AFFAIRE
    // ═══════════════════════════════════════════════════════════════
    section('DOSSIER / AFFAIRE');
    row('Reference Dossier',   safe(data.dossierRef));
    if (data.clientNom && data.clientNom !== '—' && data.clientNom !== '-') {
      row('Client', safe(data.clientNom));
    }
    if (data.missionLabel && data.missionLabel !== '—' && data.missionLabel !== '-') {
      row('Mission liee', safe(data.missionLabel), G);
    }

    // ═══════════════════════════════════════════════════════════════
    // SECTION 3 — RECAPITULATIF
    // ═══════════════════════════════════════════════════════════════
    section('RECAPITULATIF FACTURE');
    row('Numero Facture',  safe(f.numero));
    row('Date Paiement',   fmtDateTime(f.datePaiement), BL, true);
    row('Statut',          'PAYEE', G, true);

    // ═══════════════════════════════════════════════════════════════
    // SIGNATURE ZONE
    // ═══════════════════════════════════════════════════════════════
    y += 4;
    ss(GL); doc.setLineWidth(0.3);
    doc.line(ml, y, ml + cw, y);
    y += 6;

    st(GR); N(8);
    doc.text('Signature & Cachet Responsable', ml + 4, y);

    ss(GL); doc.setLineWidth(0.3);
    doc.roundedRect(ml + 4, y + 3, 60, 20, 1.5, 1.5, 'S');

    // ═══════════════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════════════
    sf(G);  doc.rect(0, pageH - 18, pageW, 18, 'F');
    sf(GD); doc.rect(0, pageH - 18, 4, 18, 'F');

    st(WH); N(7.5);
    doc.text(
      'Banque Nationale Agricole (BNA) - Siege Social : Avenue Mohamed V, Tunis 1002, Tunisie',
      pageW / 2, pageH - 10, { align: 'center' }
    );
    N(7);
    const now = new Date();
    const genDate = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    doc.text(
      `Document genere automatiquement le ${genDate} - Confidentiel`,
      pageW / 2, pageH - 4, { align: 'center' }
    );
    doc.text('Page 1 / 1', pageW - mr, pageH - 4, { align: 'right' });

    // ── Save ──────────────────────────────────────────────────────
    doc.save(`Facture_BNA_${f.numero}.pdf`);
  }
}
