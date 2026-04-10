import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { DEFAULT_CATEGORIES, DEFAULT_INVESTMENT_TYPES } from '@/lib/types';
import type { Transaction, TransactionType, Payable, Payment, Investment, Category, CategoryGroup } from '@/lib/types';

interface DataContextType {
  data: {
    transactions: Transaction[];
    payables: Payable[];
    investments: Investment[];
    categories: Category[];
    investmentTypes: string[];
  };
  loading: boolean;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addPayable: (p: Omit<Payable, 'id' | 'createdAt' | 'paidAmount' | 'payments'>) => Promise<void>;
  updatePayable: (id: string, p: Partial<Payable>) => Promise<void>;
  deletePayable: (id: string) => Promise<void>;
  addPayment: (payableId: string, payment: Omit<Payment, 'id'>, clientName: string) => Promise<void>;
  updatePayment: (payableId: string, paymentId: string, updates: Partial<Payment>) => Promise<void>;
  deletePayment: (payableId: string, paymentId: string) => Promise<void>;
  addInvestment: (i: Omit<Investment, 'id' | 'createdAt'>) => Promise<void>;
  updateInvestment: (id: string, i: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addCategory: (c: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addInvestmentType: (type: string) => Promise<void>;
  deleteInvestmentType: (type: string) => Promise<void>;
  totalRevenus: number;
  totalDepenses: number;
  totalAPayer: number;
  solde: number;
  exportData: () => string;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [investmentTypes, setInvestmentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [txRes, payRes, pmtRes, invRes, catRes] = await Promise.all([
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('payables').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('investments').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
    ]);

    // Map transactions
    setTransactions((txRes.data || []).map((t: any) => ({
      id: t.id, type: t.type, category: t.category, amount: Number(t.amount),
      date: t.date, description: t.description || '', createdAt: t.created_at,
    })));

    // Map payables with their payments
    const paymentsMap: Record<string, Payment[]> = {};
    (pmtRes.data || []).forEach((p: any) => {
      if (!paymentsMap[p.payable_id]) paymentsMap[p.payable_id] = [];
      paymentsMap[p.payable_id].push({ id: p.id, amount: Number(p.amount), date: p.date, note: p.note || '' });
    });

    setPayables((payRes.data || []).map((p: any) => ({
      id: p.id, client: p.client, description: p.description || '',
      totalAmount: Number(p.total_amount), paidAmount: Number(p.paid_amount),
      payments: paymentsMap[p.id] || [], createdAt: p.created_at,
    })));

    setInvestments((invRes.data || []).map((i: any) => ({
      id: i.id, type: i.type, name: i.name, amount: Number(i.amount),
      date: i.date, description: i.description || '', createdAt: i.created_at,
    })));

    // If no categories exist, seed defaults
    if ((catRes.data || []).length === 0) {
      const catInserts = DEFAULT_CATEGORIES.map(c => ({
        user_id: userId, name: c.name, group: c.group,
      }));
      const { data: insertedCats } = await supabase.from('categories').insert(catInserts).select();
      setCategories((insertedCats || []).map((c: any) => ({ id: c.id, name: c.name, group: c.group })));
    } else {
      setCategories((catRes.data || []).map((c: any) => ({ id: c.id, name: c.name, group: c.group })));
    }

    // Investment types are managed locally
    setInvestmentTypes(DEFAULT_INVESTMENT_TYPES);

    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Transactions ---
  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!userId) return;
    const { data, error } = await supabase.from('transactions').insert({
      user_id: userId, type: t.type, category: t.category, amount: t.amount, date: t.date, description: t.description,
    }).select().single();
    if (!error && data) {
      setTransactions(prev => [{ id: data.id, type: data.type as TransactionType, category: data.category, amount: Number(data.amount), date: data.date, description: data.description || '', createdAt: data.created_at }, ...prev]);
    }
  }, [userId]);

  const updateTransaction = useCallback(async (id: string, t: Partial<Transaction>) => {
    const updateData: any = {};
    if (t.type !== undefined) updateData.type = t.type;
    if (t.category !== undefined) updateData.category = t.category;
    if (t.amount !== undefined) updateData.amount = t.amount;
    if (t.date !== undefined) updateData.date = t.date;
    if (t.description !== undefined) updateData.description = t.description;
    await supabase.from('transactions').update(updateData).eq('id', id);
    setTransactions(prev => prev.map(tr => tr.id === id ? { ...tr, ...t } : tr));
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(tr => tr.id !== id));
  }, []);

  // --- Payables ---
  const addPayable = useCallback(async (p: Omit<Payable, 'id' | 'createdAt' | 'paidAmount' | 'payments'>) => {
    if (!userId) return;
    const { data, error } = await supabase.from('payables').insert({
      user_id: userId, client: p.client, description: p.description, total_amount: p.totalAmount,
    }).select().single();
    if (!error && data) {
      setPayables(prev => [{
        id: data.id, client: data.client, description: data.description || '',
        totalAmount: Number(data.total_amount), paidAmount: 0, payments: [], createdAt: data.created_at,
      }, ...prev]);
    }
  }, [userId]);

  const updatePayable = useCallback(async (id: string, p: Partial<Payable>) => {
    const updateData: any = {};
    if (p.client !== undefined) updateData.client = p.client;
    if (p.description !== undefined) updateData.description = p.description;
    if (p.totalAmount !== undefined) updateData.total_amount = p.totalAmount;
    await supabase.from('payables').update(updateData).eq('id', id);
    setPayables(prev => prev.map(pa => pa.id === id ? { ...pa, ...p } : pa));
  }, []);

  const deletePayable = useCallback(async (id: string) => {
    await supabase.from('payables').delete().eq('id', id);
    setPayables(prev => prev.filter(pa => pa.id !== id));
  }, []);

  // --- Payments (+ auto-create revenue transaction) ---
  const addPayment = useCallback(async (payableId: string, payment: Omit<Payment, 'id'>, clientName: string) => {
    if (!userId) return;

    // Insert payment
    const { data: pmtData, error: pmtError } = await supabase.from('payments').insert({
      payable_id: payableId, amount: payment.amount, date: payment.date, note: payment.note,
    }).select().single();

    if (pmtError || !pmtData) return;

    // Update payable paid_amount
    const payable = payables.find(p => p.id === payableId);
    if (!payable) return;
    const newPaid = Math.min(payable.paidAmount + payment.amount, payable.totalAmount);
    await supabase.from('payables').update({ paid_amount: newPaid }).eq('id', payableId);

    // Auto-create revenue transaction for this payment
    const { data: txData } = await supabase.from('transactions').insert({
      user_id: userId, type: 'revenu', category: 'Paiement client',
      amount: payment.amount, date: payment.date,
      description: `Paiement de ${clientName} — ${payment.note || 'Paiement échelonné'}`,
    }).select().single();

    // Update local state
    setPayables(prev => prev.map(pa => {
      if (pa.id !== payableId) return pa;
      return {
        ...pa, paidAmount: newPaid,
        payments: [...pa.payments, { id: pmtData.id, amount: Number(pmtData.amount), date: pmtData.date, note: pmtData.note || '' }],
      };
    }));

    if (txData) {
      setTransactions(prev => [{
        id: txData.id, type: txData.type as TransactionType, category: txData.category,
        amount: Number(txData.amount), date: txData.date,
        description: txData.description || '', createdAt: txData.created_at,
      }, ...prev]);
    }
  }, [userId, payables]);

  const updatePayment = useCallback(async (payableId: string, paymentId: string, updates: Partial<Payment>) => {
    const updateData: any = {};
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.note !== undefined) updateData.note = updates.note;

    await supabase.from('payments').update(updateData).eq('id', paymentId);

    // Recalculate paid_amount if amount changed
    if (updates.amount !== undefined) {
      const payable = payables.find(p => p.id === payableId);
      if (payable) {
        const oldPayment = payable.payments.find(p => p.id === paymentId);
        const diff = updates.amount - (oldPayment?.amount || 0);
        const newPaid = Math.max(0, Math.min(payable.paidAmount + diff, payable.totalAmount));
        await supabase.from('payables').update({ paid_amount: newPaid }).eq('id', payableId);
        setPayables(prev => prev.map(pa => {
          if (pa.id !== payableId) return pa;
          return {
            ...pa, paidAmount: newPaid,
            payments: pa.payments.map(p => p.id === paymentId ? { ...p, ...updates } : p),
          };
        }));
      }
    } else {
      setPayables(prev => prev.map(pa => {
        if (pa.id !== payableId) return pa;
        return { ...pa, payments: pa.payments.map(p => p.id === paymentId ? { ...p, ...updates } : p) };
      }));
    }
  }, [payables]);

  const deletePayment = useCallback(async (payableId: string, paymentId: string) => {
    const payable = payables.find(p => p.id === payableId);
    if (!payable) return;
    const payment = payable.payments.find(p => p.id === paymentId);
    if (!payment) return;

    await supabase.from('payments').delete().eq('id', paymentId);

    const newPaid = Math.max(0, payable.paidAmount - payment.amount);
    await supabase.from('payables').update({ paid_amount: newPaid }).eq('id', payableId);

    setPayables(prev => prev.map(pa => {
      if (pa.id !== payableId) return pa;
      return {
        ...pa, paidAmount: newPaid,
        payments: pa.payments.filter(p => p.id !== paymentId),
      };
    }));
  }, [payables]);

  // --- Investments ---
  const addInvestment = useCallback(async (i: Omit<Investment, 'id' | 'createdAt'>) => {
    if (!userId) return;
    const { data, error } = await supabase.from('investments').insert({
      user_id: userId, type: i.type, name: i.name, amount: i.amount, date: i.date, description: i.description,
    }).select().single();
    if (!error && data) {
      setInvestments(prev => [{
        id: data.id, type: data.type, name: data.name, amount: Number(data.amount),
        date: data.date, description: data.description || '', createdAt: data.created_at,
      }, ...prev]);
    }
  }, [userId]);

  const updateInvestment = useCallback(async (id: string, i: Partial<Investment>) => {
    const updateData: any = {};
    if (i.type !== undefined) updateData.type = i.type;
    if (i.name !== undefined) updateData.name = i.name;
    if (i.amount !== undefined) updateData.amount = i.amount;
    if (i.date !== undefined) updateData.date = i.date;
    if (i.description !== undefined) updateData.description = i.description;
    await supabase.from('investments').update(updateData).eq('id', id);
    setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, ...i } : inv));
  }, []);

  const deleteInvestment = useCallback(async (id: string) => {
    await supabase.from('investments').delete().eq('id', id);
    setInvestments(prev => prev.filter(inv => inv.id !== id));
  }, []);

  // --- Categories ---
  const addCategory = useCallback(async (c: Omit<Category, 'id'>) => {
    if (!userId) return;
    const { data, error } = await supabase.from('categories').insert({
      user_id: userId, name: c.name, group: c.group,
    }).select().single();
    if (!error && data) {
      setCategories(prev => [...prev, { id: data.id, name: data.name, group: data.group as CategoryGroup }]);
    }
  }, [userId]);

  const deleteCategory = useCallback(async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  // --- Investment Types (local only) ---
  const addInvestmentType = useCallback(async (typeName: string) => {
    setInvestmentTypes(prev => [...prev, typeName]);
  }, []);

  const deleteInvestmentType = useCallback(async (typeName: string) => {
    setInvestmentTypes(prev => prev.filter(t => t !== typeName));
  }, []);

  const totalRevenus = transactions.filter(t => t.type === 'revenu').reduce((s, t) => s + t.amount, 0);
  const totalDepenses = transactions.filter(t => t.type === 'depense').reduce((s, t) => s + t.amount, 0);
  const totalAPayer = payables.reduce((s, p) => s + (p.totalAmount - p.paidAmount), 0);
  const solde = totalRevenus - totalDepenses;

  const exportData = useCallback(() => {
    return JSON.stringify({ transactions, payables, investments, categories, investmentTypes }, null, 2);
  }, [transactions, payables, investments, categories, investmentTypes]);

  return (
    <DataContext.Provider value={{
      data: { transactions, payables, investments, categories, investmentTypes },
      loading,
      addTransaction, updateTransaction, deleteTransaction,
      addPayable, updatePayable, deletePayable, addPayment, updatePayment, deletePayment,
      addInvestment, updateInvestment, deleteInvestment,
      addCategory, deleteCategory,
      addInvestmentType, deleteInvestmentType,
      totalRevenus, totalDepenses, totalAPayer, solde, exportData,
      refresh: fetchAll,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
