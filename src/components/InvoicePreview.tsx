import { useEffect, useMemo, useRef, useState } from 'react';
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
  const container = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [availableWidth, setAvailableWidth] = useState(794 * scale);
  const [documentHeight, setDocumentHeight] = useState(1123);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailableWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== 'invoice-pages') return;
      const height = Number(event.data.height);
      if (Number.isFinite(height) && height > 0) setDocumentHeight(height);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);
  const html = useMemo(
    () => buildInvoiceHTML(invoice ?? SAMPLE_INVOICE, items ?? SAMPLE_ITEMS, settings),
    [settings, invoice, items]
  );

  const W = 794;
  const actualScale = Math.min(scale, availableWidth / W);

  return (
    <div ref={container} className="w-full mx-auto" style={{ maxWidth: W * scale }}>
    <div className="border bg-muted/30 overflow-hidden" style={{ width: W * actualScale, height: documentHeight * actualScale }}>
      <iframe
        ref={frame}
        title="Prévisualisation facture"
        srcDoc={html}
        sandbox="allow-scripts"
        style={{
          width: W,
          height: documentHeight,
          border: 0,
          transform: `scale(${actualScale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
    </div>
  );
}
