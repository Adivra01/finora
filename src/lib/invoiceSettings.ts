export type InvoiceSettings = {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  senderAddress: string;
  senderCity: string;
  paymentLabel: string;
  paymentAccountLabel: string;
  paymentAccount: string;
  signatureLabel: string;
  thanksLine1: string;
  thanksLine2: string;
  currency: string;
};

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  senderName: '',
  senderPhone: '+223 69 65 66 10',
  senderEmail: 'contact@africademia.com',
  senderAddress: 'Bamako, Mali',
  senderCity: 'Bamako',
  paymentLabel: 'Paiement effectuer par Orange Money SN',
  paymentAccountLabel: 'N° de compte',
  paymentAccount: '+223 75 32 91 64',
  signatureLabel: 'Signature reception client :',
  thanksLine1: 'MERCI POUR',
  thanksLine2: 'VOTRE CONFIANCE',
  currency: 'F',
};

const KEY = 'fintrack_invoice_settings';

export function loadInvoiceSettings(): InvoiceSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_INVOICE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_INVOICE_SETTINGS;
}

export function saveInvoiceSettings(s: InvoiceSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export const PAYMENT_PRESETS = [
  'Paiement effectuer par Orange Money SN',
  'Paiement par Virement bancaire',
  'Paiement par Western Union',
  'Paiement par Wave',
  'Paiement par Moov Money',
  'Paiement en espèces',
];
