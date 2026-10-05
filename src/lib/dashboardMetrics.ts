import type { Transaction, Payable, Investment } from '@/lib/types';

export function dashboardMetrics(transactions: Transaction[], payables: Payable[], year: number, taxRate: number, taxPaid: number, investments: Investment[] = []) {
  const yearly = transactions.filter(t => t.date.startsWith(`${year}-`));
  const revenue = yearly.filter(t => t.type === 'revenu').reduce((sum, t) => sum + t.amount, 0);
  const expenses = yearly.filter(t => t.type === 'depense').reduce((sum, t) => sum + t.amount, 0);
  const invested = investments.filter(i => i.date.startsWith(`${year}-`)).reduce((sum, i) => sum + i.amount, 0);
  const tax = revenue * taxRate / 100;
  return {
    yearly,
    revenue,
    expenses,
    invested,
    investedTotal: investments.reduce((sum, i) => sum + i.amount, 0),
    cashFlow: revenue - expenses - invested,
    tax,
    taxPaid,
    taxRemaining: Math.max(0, tax - taxPaid),
    payableRemaining: payables.reduce((sum, p) => sum + Math.max(0, p.totalAmount - p.paidAmount), 0),
  };
}
