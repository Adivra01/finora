import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Plus, Trash2, ShoppingCart, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface PlannedExpense {
  id: string;
  category: string;
  amount: number;
  description: string;
  plannedDate: string;
  isSpent: boolean;
  createdAt: string;
}

const formatMoney = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

const PlannedExpenses = () => {
  const { userId } = useAuth();
  const { data: appData, refresh } = useData();
  const [expenses, setExpenses] = useState<PlannedExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const perPage = 10;

  const depenseCategories = appData.categories.filter(c => c.group === 'depense' || c.group === 'business');

  const fetchExpenses = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('planned_expenses')
      .select('*')
      .order('created_at', { ascending: false });
    setExpenses((data || []).map((e: any) => ({
      id: e.id, category: e.category, amount: Number(e.amount),
      description: e.description || '', plannedDate: e.planned_date,
      isSpent: e.is_spent, createdAt: e.created_at,
    })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount || !userId) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    const { data, error } = await supabase.from('planned_expenses').insert({
      user_id: userId, category, amount: amt, description, planned_date: plannedDate,
    }).select().single();

    if (!error && data) {
      setExpenses(prev => [{
        id: data.id, category: data.category, amount: Number(data.amount),
        description: data.description || '', plannedDate: data.planned_date,
        isSpent: false, createdAt: data.created_at,
      }, ...prev]);
      setCategory(''); setAmount(''); setDescription('');
      setPlannedDate(new Date().toISOString().slice(0, 10));
    }
  };

  const handleSpend = async (expense: PlannedExpense) => {
    if (expense.isSpent || !userId) return;

    // Mark as spent
    await supabase.from('planned_expenses').update({ is_spent: true }).eq('id', expense.id);

    // Create expense transaction linked to this planned expense
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'depense',
      category: expense.category,
      amount: expense.amount,
      date: new Date().toISOString().slice(0, 10),
      description: expense.description || `Dépense prévue — ${expense.category}`,
      planned_expense_id: expense.id,
    } as any);

    setExpenses(prev => prev.map(e => e.id === expense.id ? { ...e, isSpent: true } : e));
    await refresh();
  };

  const handleDelete = async (id: string) => {
    // Delete linked transaction first
    await (supabase.from('transactions').delete() as any).eq('planned_expense_id', id);
    // Delete the planned expense
    await supabase.from('planned_expenses').delete().eq('id', id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    await refresh();
  };

  const pending = expenses.filter(e => !e.isSpent);
  const spent = expenses.filter(e => e.isSpent);
  const totalPending = pending.reduce((s, e) => s + e.amount, 0);

  const sorted = expenses;
  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Dépenses Prévues</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Planifiez vos dépenses et dépensez quand c'est le moment — Total en attente : <span className="font-semibold text-warning">{formatMoney(totalPending)}</span>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleAdd} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Nouvelle dépense prévue</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Sélectionner</option>
              {depenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Montant</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Date prévue</label>
            <input type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="mt-4">
          <button type="submit" className="flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
            <Plus className="w-4 h-4" />Ajouter
          </button>
        </div>
      </form>

      {/* List */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Liste des dépenses ({pending.length} en attente · {spent.length} dépensées)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date prévue</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Catégorie</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Description</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Montant</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Statut</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(exp => (
                <tr key={exp.id} className={`border-b border-border/50 transition ${exp.isSpent ? 'opacity-60 bg-muted/30' : 'hover:bg-secondary/30'}`}>
                  <td className="px-4 py-3 text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {new Date(exp.plannedDate).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">{exp.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{exp.description || '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-foreground">{formatMoney(exp.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    {exp.isSpent ? (
                      <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">Dépensé ✓</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">En attente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!exp.isSpent && (
                        <button
                          onClick={() => handleSpend(exp)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Dépenser
                        </button>
                      )}
                      <button onClick={() => handleDelete(exp.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Aucune dépense prévue</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Page {page} sur {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-secondary transition disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-secondary transition disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlannedExpenses;
