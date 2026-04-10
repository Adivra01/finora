import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Investment } from '@/lib/types';

const formatMoney = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

const Investments = () => {
  const { data, addInvestment, updateInvestment, deleteInvestment, addInvestmentType, deleteInvestmentType } = useData();
  const [type, setType] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newType, setNewType] = useState('');
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const resetForm = () => {
    setType(''); setName(''); setAmount(''); setDate(new Date().toISOString().slice(0, 10)); setDescription(''); setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !name || !amount) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    if (editingId) {
      updateInvestment(editingId, { type, name, amount: amt, date, description });
    } else {
      addInvestment({ type, name, amount: amt, date, description });
    }
    resetForm();
  };

  const handleAddType = () => {
    if (!newType.trim()) return;
    addInvestmentType(newType.trim());
    setNewType('');
    setShowTypeForm(false);
  };

  const startEdit = (inv: Investment) => {
    setEditingId(inv.id); setType(inv.type); setName(inv.name); setAmount(inv.amount.toString()); setDate(inv.date); setDescription(inv.description);
  };

  const sorted = [...data.investments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);
  const totalInvested = data.investments.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Investissements</h1>
          <p className="text-muted-foreground text-sm mt-1">Total investi : {formatMoney(totalInvested)}</p>
        </div>
        <button onClick={() => setShowTypeForm(!showTypeForm)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition">
          <Plus className="w-4 h-4" />Nouveau type
        </button>
      </div>

      {showTypeForm && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Types d'investissement</h3>
          <div className="flex gap-2 mb-3">
            <input type="text" value={newType} onChange={e => setNewType(e.target.value)} placeholder="Nouveau type"
              className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <button onClick={handleAddType} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition">Ajouter</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.investmentTypes.map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-sm text-foreground">
                {t}
                <button onClick={() => deleteInvestmentType(t)} className="text-muted-foreground hover:text-destructive transition">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{editingId ? 'Modifier' : 'Nouvel investissement'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Sélectionner</option>
              {data.investmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Nom</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom de l'investissement"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
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
          <button type="submit" className="flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
            <Plus className="w-4 h-4" />{editingId ? 'Modifier' : 'Ajouter'}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="h-10 px-5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition">Annuler</button>}
        </div>
      </form>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Nom</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Description</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Montant</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(inv => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition">
                  <td className="px-4 py-3 text-sm text-foreground">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-info/10 text-info text-xs font-medium">{inv.type}</span></td>
                  <td className="px-4 py-3 text-sm text-foreground">{inv.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{inv.description || '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-foreground">{formatMoney(inv.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(inv)} className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteInvestment(inv.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Aucun investissement</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Page {page} sur {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-secondary transition disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-secondary transition disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Investments;
