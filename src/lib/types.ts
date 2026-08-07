export type TransactionType = 'revenu' | 'depense';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  description: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note: string;
}

export interface Payable {
  id: string;
  client: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  payments: Payment[];
  createdAt: string;
}

export interface Investment {
  id: string;
  type: string;
  name: string;
  amount: number;
  date: string;
  description: string;
  createdAt: string;
}

export type CategoryGroup = 'depense' | 'revenu' | 'business' | 'fiscalite';

export interface Category {
  id: string;
  name: string;
  group: CategoryGroup;
}

export interface AppData {
  transactions: Transaction[];
  payables: Payable[];
  investments: Investment[];
  categories: Category[];
  investmentTypes: string[];
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Loyer', group: 'depense' },
  { id: 'c2', name: 'Nourriture', group: 'depense' },
  { id: 'c3', name: 'Transport', group: 'depense' },
  { id: 'c4', name: 'Santé', group: 'depense' },
  { id: 'c5', name: 'Loisirs', group: 'depense' },
  { id: 'c6', name: 'Éducation', group: 'depense' },
  { id: 'c7', name: 'Factures', group: 'depense' },
  { id: 'c8', name: 'Salaire', group: 'revenu' },
  { id: 'c9', name: 'Freelance', group: 'revenu' },
  { id: 'c10', name: 'Investissement', group: 'revenu' },
  { id: 'c11', name: 'Autres', group: 'revenu' },
  { id: 'c12', name: 'Consultation', group: 'business' },
  { id: 'c13', name: 'Développement', group: 'business' },
  { id: 'c14', name: 'Design', group: 'business' },
  { id: 'c15', name: 'Marketing', group: 'business' },
];

export const DEFAULT_INVESTMENT_TYPES = [
  'Crypto', 'Actions', 'Obligations', 'Immobilier', 'Fonds communs', 'Épargne'
];
