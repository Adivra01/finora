import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction, TransactionType } from '@/lib/types';

const formatMoney = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

const Transactions = () => {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useData();
  const [type, setType] = useState<TransactionType>('depense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const categories = data.categories.filter(c =>
    type === 'revenu' ? c.group === 'revenu' : c.group === 'depense' || c.group === 'business'
  );

  const resetForm = () => {
    setType('depense');
    setCategory('');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (editingId) {
      updateTransaction(editingId, { type, category, amount: amountNum, date, description });
    } else {
      addTransaction({ type, category, amount: amountNum, date, description });
    }
    resetForm();
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setType(t.type);
    setCategory(t.category);
    setAmount(t.amount.toString());
    setDate(t.date);
    setDescription(t.description);
  };

  const sorted = [...data.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Transactions</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos revenus et dépenses</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {editingId ? 'Modifier la transaction' : 'Nouvelle transaction'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Type</label>
            <select value={type} onChange={e => { setType(e.target.value as TransactionType); setCategory(''); }}
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="depense">Dépense</option>
              <option value="revenu">Revenu</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Sélectionner</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Montant</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs text-muted-foreground">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button type="submit"
            className="flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
            <Plus className="w-4 h-4" />
            {editingId ? 'Modifier' : 'Ajouter'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}
              className="h-10 px-5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition">
              Annuler
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Historique ({sorted.length})</h3>
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="h-8 px-2 rounded-lg bg-secondary border border-border text-xs text-foreground">
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Catégorie</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Description</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Montant</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                  <td className="px-4 py-3 text-sm text-foreground">{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.type === 'revenu' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {t.type === 'revenu' ? 'Revenu' : 'Dépense'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{t.category}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{t.description || '—'}</td>
                  <td className={`px-4 py-3 text-sm font-semibold text-right ${t.type === 'revenu' ? 'text-success' : 'text-destructive'}`}>
                    {t.type === 'revenu' ? '+' : '-'}{formatMoney(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteTransaction(t.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Aucune transaction</td></tr>
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

export default Transactions;
