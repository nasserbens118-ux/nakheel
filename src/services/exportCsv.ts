// GourFeed — CSV export utility (browser-native, no external dependency)

type Row = Record<string, string | number | boolean | null | undefined>;

function escapeCsv(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(rows: Row[], filename: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => headers.map(h => escapeCsv(row[h])).join(',')),
  ];
  const blob = new Blob(['﻿' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Domain-specific helpers ────────────────────────────────────────────────

import type { WasteRequest, ProductionBatch, Order } from './db';

export function exportWasteRequests(rows: WasteRequest[]): void {
  downloadCsv(
    rows.map(r => ({
      ID:              r.id,
      Fournisseur:     r.supplierId,
      Type:            r.wasteType,
      'Quantité (kg)': r.estimatedQuantityKg,
      Localisation:    r.location,
      Statut:          r.status,
      'Score Qualité': r.aiQualityScore,
      'Décision':      r.aiDecision ?? '',
      'Date Dispo':    r.availabilityDate,
      'Créé le':       r.createdAt,
    })),
    `nakheel_dechets_${new Date().toISOString().split('T')[0]}.csv`
  );
}

export function exportProductionBatches(rows: ProductionBatch[]): void {
  downloadCsv(
    rows.map(b => ({
      'N° Lot':        b.batchNumber,
      Produit:         b.productId,
      Formule:         b.formulaUsed,
      'Qté produite':  b.producedQuantityKg,
      'Date Prod.':    b.productionDate,
      Statut:          b.status,
      Qualité:         b.qualityStatus,
    })),
    `nakheel_lots_${new Date().toISOString().split('T')[0]}.csv`
  );
}

export function exportOrders(rows: Order[]): void {
  downloadCsv(
    rows.map(o => ({
      'Réf Commande':    o.id,
      Client:            o.clientId,
      'Qté (kg)':        o.totalQuantityKg,
      'Montant (DA)':    o.totalAmount,
      'Commission (DA)': o.commissionAmount ?? Math.round(o.totalAmount * 0.04),
      Mode:              o.deliveryMethod,
      Adresse:           o.deliveryLocation,
      Statut:            o.status,
      Paiement:          o.paymentStatus,
      'Créée le':        o.createdAt,
    })),
    `nakheel_commandes_${new Date().toISOString().split('T')[0]}.csv`
  );
}
