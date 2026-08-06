import { useMemo } from 'react';
import { InvoiceSettings } from '@/lib/invoiceSettings';
import { buildInvoiceHTML, TemplateInvoice, TemplateItem } from '@/lib/invoiceTemplate';

export const SAMPLE_INVOICE: TemplateInvoice = {
  invoice_number: 'FAC-202601-0001',
  type: 'facture',
  client_name: 'Awa Diallo',
  client_email: 'awa.diallo@example.com',
  client_address: 'Hamdallaye ACI 2000, Bamako',
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: null,
  notes: '',
  subtotal: 250000,
  tax_rate: 0,
  tax_amount: 0,
  total: 250000,
};

export const SAMPLE_ITEMS: TemplateItem[] = [
  { description: 'Prestation de service - Accompagnement', quantity: 1, unit_price: 150000, total: 150000 },
  { description: 'Consultation data (2 séances)', quantity: 2, unit_price: 50000, total: 100000 },
];

type Props = {
  settings: InvoiceSettings;
  invoice?: TemplateInvoice;
  items?: TemplateItem[];
  /** rendered A4 width is 210mm ≈ 794px */
  scale?: number;
};

export default function InvoicePreview({ settings, invoice, items, scale = 0.55 }: Props) {
  const html = useMemo(
    () => buildInvoiceHTML(invoice ?? SAMPLE_INVOICE, items ?? SAMPLE_ITEMS, settings),
    [settings, invoice, items]
  );

  const W = 794;
  const H = 1123;

  return (
    <div
      className="rounded-lg border bg-muted/30 overflow-hidden mx-auto"
      style={{ width: W * scale, height: H * scale }}
    >
      <iframe
        title="Prévisualisation facture"
        srcDoc={html}
        sandbox="allow-same-origin"
        style={{
          width: W,
          height: H,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
}
