import { describe, expect, it } from 'vitest';
import { dashboardMetrics } from '@/lib/dashboardMetrics';
import type { Transaction, Payable } from '@/lib/types';

const tx = (id: string, date: string, type: Transaction['type'], amount: number): Transaction =>
  ({ id, date, type, amount, category: 'Paiement client', description: '', createdAt: date });

describe('dashboard fiscal reconciliation', () => {
  const transactions = [
    tx('a', '2026-10-01', 'revenu', 200000),
    tx('b', '2026-07-16', 'revenu', 157000),
    tx('c', '2026-09-14', 'depense', 50000),
    tx('d', '2025-10-01', 'revenu', 100000),
  ];

  it('counts all retained revenue transactions for the selected year, including client payments', () => {
    expect(dashboardMetrics(transactions, [], 2026, 3, 0).revenue).toBe(357000);
  });

  it('uses the saved tax rate and paid tax against that same annual revenue', () => {
    const result = dashboardMetrics(transactions, [], 2026, 6, 1000);
    expect(result.tax).toBe(21420);
    expect(result.taxRemaining).toBe(20420);
  });

  it('keeps expenses and unpaid client balances separate from revenue', () => {
    const payables = [{ totalAmount: 200000, paidAmount: 30000 }] as Payable[];
    const result = dashboardMetrics(transactions, payables, 2026, 3, 0);
    expect(result.expenses).toBe(50000);
    expect(result.cashFlow).toBe(307000);
    expect(result.payableRemaining).toBe(170000);
  });

  it('deducts investments of the selected year from net cash flow', () => {
    const investments = [
      { id: 'i1', type: 'Crypto', name: 'x', amount: 100000, date: '2026-05-01', description: '', createdAt: '' },
      { id: 'i2', type: 'Crypto', name: 'y', amount: 40000, date: '2025-05-01', description: '', createdAt: '' },
    ];
    const result = dashboardMetrics(transactions, [], 2026, 3, 0, investments);
    expect(result.invested).toBe(100000);
    expect(result.cashFlow).toBe(207000);
    expect(result.investedTotal).toBe(140000);
  });
});