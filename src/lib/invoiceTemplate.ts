import { InvoiceSettings } from './invoiceSettings';
import documentCSS from './invoiceDocument.css?raw';
import pagedScript from '../../node_modules/pagedjs/dist/paged.polyfill.min.js?url';
import mountain from '@/assets/invoice-mountain.asset.json';

export type TemplateInvoice = {
  invoice_number: string;
  type: string;
  client_name: string;
  client_email: string;
  client_address: string;
  issue_date: string;
  due_date: string | null;
  notes: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status?: string;
  paid_amount?: number;
};

export type TemplateItem = { description: string; quantity: number; unit_price: number; total: number };
const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n).replace(/\u202f/g, ' ');
const date = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
};
export const longDate = (iso: string, city: string) => `${city}, le ${date(iso)}`;
const statuses: Record<string, string> = { brouillon: 'Brouillon', 'envoyé': 'Envoyé', partiel: 'Partiellement payé', 'payé': 'Payé', 'annulé': 'Annulé' };

export function buildInvoiceHTML(inv: TemplateInvoice, items: TemplateItem[], s: InvoiceSettings): string {
  const title = inv.type === 'facture' ? 'FACTURE' : 'DEVIS';
  const money = (n: number) => `${num(Number(n))} ${esc(s.currency || 'FCFA')}`;
  const sender = [s.senderAddress, s.senderPhone, s.senderEmail].filter(Boolean).map(v => `<p>${esc(v)}</p>`).join('');
  const paid = Number(inv.paid_amount || 0);
  const scriptURL = new URL(pagedScript, window.location.origin).href;
  const mountainURL = new URL(mountain.url, window.location.origin).href;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${title} ${esc(inv.invoice_number)}</title>
<style>${documentCSS}</style>
<script>window.PagedConfig={auto:false};</script><script src="${esc(scriptURL)}"></script></head><body>
<header class="banner"><div class="brand"><div class="brand-name">${esc(s.senderName)}</div><div class="brand-details">${sender}</div></div><img class="landscape" src="${esc(mountainURL)}" alt=""></header>
<section class="document-heading"><div><h1>${title}</h1><span class="accent-line"></span></div><div class="metadata">
<div class="meta-row"><span class="meta-label">N° ${title}</span><strong class="document-number">${esc(inv.invoice_number)}</strong></div>
<div class="meta-row"><span class="meta-label">Date d'émission</span><strong>${esc(date(inv.issue_date))}</strong></div>
${inv.due_date ? `<div class="meta-row"><span class="meta-label">Date d'échéance</span><strong>${esc(date(inv.due_date))}</strong></div>` : ''}
${inv.status ? `<div class="meta-row"><span class="meta-label">Statut</span><strong>${esc(statuses[inv.status] || inv.status)}</strong></div>` : ''}</div></section>
<section class="parties"><div class="party"><h2>${inv.type === 'facture' ? 'Facturé à' : 'Destinataire'}<span class="accent-line"></span></h2><strong>${esc(inv.client_name)}</strong><p>${esc(inv.client_address)}</p><p>${esc(inv.client_email)}</p></div>
<div class="party"><h2>Émis par<span class="accent-line"></span></h2><strong>${esc(s.senderName)}</strong>${sender}</div></section>
<table class="items"><colgroup><col><col><col><col></colgroup><thead><tr><th>Désignation</th><th>Quantité</th><th>Prix unitaire</th><th>Montant</th></tr></thead><tbody>
${items.map(it => `<tr><td>${esc(it.description)}</td><td>${num(it.quantity)}</td><td>${money(it.unit_price)}</td><td>${money(it.total)}</td></tr>`).join('')}</tbody></table>
<section class="settlement"><div class="conditions"><h2>Conditions de paiement<span class="accent-line"></span></h2><p>${esc(s.paymentLabel)}</p><p>${esc(s.paymentAccountLabel)} ${esc(s.paymentAccount)}</p>${inv.due_date ? `<p>Paiement à effectuer avant le ${esc(date(inv.due_date))}.</p>` : ''}</div>
<div class="totals"><div class="total-row"><span>Sous-total</span><span>${money(inv.subtotal)}</span></div>${Number(inv.tax_rate) > 0 ? `<div class="total-row"><span>TVA (${num(Number(inv.tax_rate))} %)</span><span>${money(inv.tax_amount)}</span></div>` : ''}<div class="total-row grand-total"><span>TOTAL</span><span>${money(inv.total)}</span></div>
${paid > 0 ? `<div class="total-row balance"><span>Déjà payé</span><span>${money(paid)}</span></div><div class="total-row"><span>Reste à payer</span><span>${money(Math.max(0, Number(inv.total) - paid))}</span></div>` : ''}</div></section>
${inv.notes ? `<section class="notes"><h2>Notes</h2>${esc(inv.notes)}</section>` : ''}
<section class="closing"><div class="thanks"><span class="accent-line"></span><p>${esc(s.thanksLine1)}<br>${esc(s.thanksLine2)}</p></div><div class="signature">${esc(s.signatureLabel)}</div></section><div class="footer-rule"></div>
<script>window.addEventListener('load',async()=>{try{await Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{})));await window.PagedPolyfill.preview();window.invoiceReady=true;window.dispatchEvent(new Event('invoice-ready'));parent.postMessage({type:'invoice-pages',height:document.documentElement.scrollHeight,pages:document.querySelectorAll('.pagedjs_page').length},'*');}catch(e){document.body.dataset.paginationError='true';}});</script>
</body></html>`;
}