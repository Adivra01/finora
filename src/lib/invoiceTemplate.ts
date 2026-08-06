import { InvoiceSettings } from './invoiceSettings';

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
};

export type TemplateItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const num = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n).replace(/\u202f/g, ' ');

export const longDate = (iso: string, city: string) => {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return `${city}, le ${String(d.getDate()).padStart(2, '0')} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
};

const shortNumber = (n: string) => {
  const m = n.match(/(\d+)\s*$/);
  return m ? m[1].slice(-2).padStart(2, '0') : n;
};

const esc = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildInvoiceHTML(
  inv: TemplateInvoice,
  items: TemplateItem[],
  s: InvoiceSettings
): string {
  const title = inv.type === 'facture' ? 'FACTURE' : 'DEVIS';
  const cur = s.currency || 'F';

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>${esc(title)} ${esc(inv.invoice_number)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rammetto+One&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  @page{size:A4;margin:0}
  html,body{background:#e5e3dd}
  body{font-family:'Poppins',sans-serif;color:#241b17;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sheet{position:relative;width:210mm;min-height:297mm;margin:0 auto;background:#f7f5ef;overflow:hidden;padding:22mm 16mm 0}
  .blob{position:absolute;z-index:0}
  .b-orange-top{top:0;left:118mm;width:44mm;height:38mm;background:#e8862b;border-radius:0 0 44mm 44mm}
  .b-yellow-top{top:0;left:150mm;width:60mm;height:44mm;background:#eee7b4;border-radius:0 0 0 60mm}
  .b-orange-bot{bottom:0;left:0;width:38mm;height:34mm;background:#e8862b;border-radius:38mm 38mm 0 0}
  .b-yellow-bot{bottom:0;left:22mm;width:52mm;height:38mm;background:#eee7b4;border-radius:52mm 0 0 0}
  .content{position:relative;z-index:1}
  h1.doc-title{font-family:'Rammetto One',cursive;font-size:44px;line-height:1.05;letter-spacing:1px;text-transform:uppercase}
  h1.doc-title .no{display:block;margin-top:4px}
  .rule{border-top:1px solid #241b17;margin:16mm 0 6mm}
  .parties{display:flex;gap:14mm;padding-bottom:5mm;border-bottom:1px solid #241b17}
  .party{flex:1;font-size:12.5px;line-height:1.75}
  .party b{font-weight:700}
  table{width:100%;border-collapse:collapse;margin-top:9mm}
  thead th{background:#241b17;color:#f7f5ef;font-family:'Rammetto One',cursive;font-size:10.5px;letter-spacing:1px;
    text-transform:uppercase;padding:9px 12px;text-align:center;font-weight:400}
  thead th:first-child{text-align:left;padding-left:16px}
  tbody td{border:1px solid #241b17;border-top:none;padding:9px 12px;font-size:12.5px;text-align:center;background:#fdfcf8}
  tbody td:first-child{text-align:left;font-weight:600}
  .totalbar{display:flex;justify-content:flex-end;align-items:center;gap:18mm;background:#241b17;color:#f7f5ef;
    padding:11px 16px;margin-top:34mm;font-size:14px}
  .totalbar .lbl{font-weight:600}
  .totalbar .val{font-weight:700}
  .subtotals{display:flex;justify-content:flex-end;gap:18mm;font-size:12px;margin-top:6mm;color:#241b17}
  .pay{margin-top:6mm;font-size:12.5px;line-height:1.8;padding-bottom:5mm;border-bottom:1px solid #241b17}
  .pay b{font-weight:700}
  .sign{margin-top:5mm;font-size:12.5px;font-weight:700}
  .notes{margin-top:5mm;font-size:12px;line-height:1.7}
  .thanks{font-family:'Rammetto One',cursive;text-transform:uppercase;text-align:right;font-size:22px;line-height:1.35;
    margin-top:26mm;padding-bottom:22mm}
  @media print{html,body{background:#f7f5ef}.sheet{margin:0}}
</style></head><body>
<div class="sheet">
  <div class="blob b-orange-top"></div>
  <div class="blob b-yellow-top"></div>
  <div class="blob b-orange-bot"></div>
  <div class="blob b-yellow-bot"></div>
  <div class="content">
    <h1 class="doc-title">${esc(title)}<span class="no">N°${esc(shortNumber(inv.invoice_number))}</span></h1>
    <div class="rule"></div>
    <div class="parties">
      <div class="party">
        <div><b>DE :</b> ${esc(s.senderPhone)}</div>
        ${s.senderName ? `<div>${esc(s.senderName)}</div>` : ''}
        <div>${esc(s.senderEmail)}</div>
        <div>${esc(s.senderAddress)}</div>
        <div>${esc(longDate(inv.issue_date, s.senderCity))}</div>
      </div>
      <div class="party">
        <div><b>A :</b> ${esc(inv.client_name)}</div>
        ${inv.client_email ? `<div>${esc(inv.client_email)}</div>` : ''}
        ${inv.client_address ? `<div>${esc(inv.client_address)}</div>` : ''}
        <div>${esc(longDate(inv.due_date || inv.issue_date, s.senderCity))}</div>
      </div>
    </div>
    <table>
      <thead><tr><th>Description</th><th>Prix</th><th>Quantité</th><th>Total</th></tr></thead>
      <tbody>
        ${items
          .map(
            (it) =>
              `<tr><td>${esc(it.description)}</td><td>${num(it.unit_price)}</td><td>${String(it.quantity).padStart(2, '0')}</td><td>${num(it.total)}</td></tr>`
          )
          .join('')}
      </tbody>
    </table>
    ${
      Number(inv.tax_rate) > 0
        ? `<div class="subtotals"><span>Sous-total : ${num(Number(inv.subtotal))}${cur}</span><span>TVA (${inv.tax_rate}%) : ${num(Number(inv.tax_amount))}${cur}</span></div>`
        : ''
    }
    <div class="totalbar"><span class="lbl">TOTAL :</span><span class="val">${num(Number(inv.total))}${cur}</span></div>
    <div class="pay">
      <div><b>${esc(s.paymentLabel)}</b></div>
      <div>${esc(s.paymentAccountLabel)} ${esc(s.paymentAccount)}</div>
    </div>
    <div class="sign">${esc(s.signatureLabel)}</div>
    ${inv.notes ? `<div class="notes">${esc(inv.notes)}</div>` : ''}
    <div class="thanks">${esc(s.thanksLine1)}<br>${esc(s.thanksLine2)}</div>
  </div>
</div>
</body></html>`;
}
