import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, DollarSign, ChevronDown, ChevronUp, Users, TrendingUp, CheckCircle2, AlertCircle, X, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Payable, Payment } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const formatMoney = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

const CHART_COLORS = ['hsl(220, 90%, 56%)', 'hsl(220, 75%, 68%)', 'hsl(220, 60%, 78%)', 'hsl(210, 100%, 56%)', 'hsl(210, 80%, 65%)', 'hsl(200, 70%, 55%)', 'hsl(195, 60%, 50%)', 'hsl(190, 55%, 45%)'];

const Payables = () => {
  const { data, addPayable, updatePayable, deletePayable, addPayment, updatePayment, deletePayment } = useData();
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Payment edit state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editPaymentNote, setEditPaymentNote] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ payableId: string; paymentId: string } | null>(null);

  const resetForm = () => {
    setClient(''); setDescription(''); setTotalAmount(''); setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !totalAmount) return;
    const amt = parseFloat(totalAmount);
    if (isNaN(amt) || amt <= 0) return;

    if (editingId) {
      updatePayable(editingId, { client, description, totalAmount: amt });
    } else {
      addPayable({ client, description, totalAmount: amt });
    }
    resetForm();
  };

  const handlePayment = (payableId: string) => {
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;
    const payable = data.payables.find(p => p.id === payableId);
    addPayment(payableId, { amount: amt, date: new Date().toISOString().slice(0, 10), note: paymentNote }, payable?.client || 'Client');
    setPaymentAmount('');
    setPaymentNote('');
  };

  const startEditPayment = (payment: Payment) => {
    setEditingPaymentId(payment.id);
    setEditPaymentAmount(payment.amount.toString());
    setEditPaymentNote(payment.note);
  };

  const handleUpdatePayment = (payableId: string) => {
    if (!editingPaymentId) return;
    const amt = parseFloat(editPaymentAmount);
    if (isNaN(amt) || amt <= 0) return;
    updatePayment(payableId, editingPaymentId, { amount: amt, note: editPaymentNote });
    setEditingPaymentId(null);
    setEditPaymentAmount('');
    setEditPaymentNote('');
  };

  const handleDeletePayment = () => {
    if (!deleteConfirm) return;
    deletePayment(deleteConfirm.payableId, deleteConfirm.paymentId);
    setDeleteConfirm(null);
  };

  const startEdit = (p: Payable) => {
    setEditingId(p.id);
    setClient(p.client);
    setDescription(p.description);
    setTotalAmount(p.totalAmount.toString());
  };

  const sorted = [...data.payables].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  // Stats
  const totalDette = data.payables.reduce((s, p) => s + p.totalAmount, 0);
  const totalPaye = data.payables.reduce((s, p) => s + p.paidAmount, 0);
  const totalRestant = totalDette - totalPaye;
  const completedCount = data.payables.filter(p => p.paidAmount >= p.totalAmount).length;

  // Chart data: debt by client
  const debtByClient = useMemo(() => {
    return data.payables
      .filter(p => p.totalAmount - p.paidAmount > 0)
      .map(p => ({ name: p.client, value: p.totalAmount - p.paidAmount }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [data.payables]);

  // Chart data: progress by payable
  const progressData = useMemo(() => {
    return data.payables
      .slice(0, 8)
      .map(p => ({
        name: p.client.length > 10 ? p.client.slice(0, 10) + '…' : p.client,
        payé: p.paidAmount,
        restant: p.totalAmount - p.paidAmount,
      }));
  }, [data.payables]);

  const stats = [
    { label: 'TOTAL DETTES', value: totalDette, icon: DollarSign, cardClass: 'stat-card-info', iconClass: 'icon-circle-info' },
    { label: 'TOTAL PAYÉ', value: totalPaye, icon: TrendingUp, cardClass: 'stat-card-success', iconClass: 'icon-circle-success' },
    { label: 'RESTANT', value: totalRestant, icon: AlertCircle, cardClass: 'stat-card-warning', iconClass: 'icon-circle-warning' },
    { label: 'SOLDÉS', value: completedCount, icon: CheckCircle2, cardClass: 'stat-card-destructive', iconClass: 'icon-circle-destructive', isCount: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">À Payer</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos paiements échelonnés et suivez vos dettes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.cardClass} hover-lift`}>
            <div className="flex items-start justify-between">
              <div className="pl-3">
                <p className="text-xs font-medium text-muted-foreground tracking-wide mb-1">{s.label}</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {s.isCount ? s.value : formatMoney(s.value)}
                </p>
              </div>
              <div className={`icon-circle ${s.iconClass}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {data.payables.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Debt by client pie */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Dettes par client</h3>
                <p className="text-xs text-muted-foreground">Répartition des soldes restants</p>
              </div>
            </div>
            {debtByClient.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={debtByClient} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="hsl(var(--card))" strokeWidth={3}>
                    {debtByClient.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px' }}
                    formatter={(value: number) => formatMoney(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">Toutes les dettes sont soldées !</div>
            )}
            {debtByClient.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {debtByClient.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 px-2.5 py-1.5 rounded-lg">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="font-medium">{d.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress bar chart */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[hsl(var(--success))]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[hsl(var(--success))]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Progression des paiements</h3>
                <p className="text-xs text-muted-foreground">Payé vs restant par client</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={progressData} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} opacity={0.5} />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(v) => v > 0 ? `${(v / 1000).toFixed(0)}k` : '0'} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px' }}
                  formatter={(value: number) => formatMoney(value)}
                />
                <Bar dataKey="payé" stackId="a" fill="hsl(220, 90%, 56%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="restant" stackId="a" fill="hsl(220, 30%, 90%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-5 mt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-2.5 rounded-sm bg-primary" />
                <span>Payé</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-2.5 rounded-sm" style={{ backgroundColor: 'hsl(220, 30%, 90%)' }} />
                <span>Restant</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {editingId ? 'Modifier le paiement' : 'Nouveau paiement'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Client</label>
            <input type="text" value={client} onChange={e => setClient(e.target.value)} placeholder="Nom du client"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Montant total</label>
            <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button type="submit" className="flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
            <Plus className="w-4 h-4" />{editingId ? 'Modifier' : 'Ajouter'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="h-10 px-5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition">Annuler</button>
          )}
        </div>
      </form>

      {/* Payables List */}
      <div className="space-y-3">
        {paginated.map(p => {
          const remaining = p.totalAmount - p.paidAmount;
          const progress = p.totalAmount > 0 ? (p.paidAmount / p.totalAmount) * 100 : 0;
          const isExpanded = expandedId === p.id;
          const isCompleted = remaining <= 0;

          return (
            <div key={p.id} className={`glass-card overflow-hidden transition-all ${isCompleted ? 'border-[hsl(var(--success))]/30' : ''}`}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {isCompleted && (
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-foreground">{p.client}</h4>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setExpandedId(isExpanded ? null : p.id)} className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deletePayable(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-sm font-semibold text-foreground">{formatMoney(p.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payé</p>
                    <p className="text-sm font-semibold text-[hsl(var(--success))]">{formatMoney(p.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Restant</p>
                    <p className={`text-sm font-semibold ${isCompleted ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]'}`}>{formatMoney(remaining)}</p>
                  </div>
                </div>

                <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-[hsl(var(--success))]' : 'bg-primary'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{progress.toFixed(0)}% payé · {p.payments.length} paiement{p.payments.length !== 1 ? 's' : ''}</p>
              </div>

              {isExpanded && (
                <div className="border-t border-border p-4 bg-muted/30">
                  {remaining > 0 && (
                    <div className="flex gap-2 mb-4">
                      <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Montant"
                        className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <input type="text" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="Note"
                        className="flex-1 h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <button onClick={() => handlePayment(p.id)}
                        className="flex items-center gap-1 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition">
                        <DollarSign className="w-3.5 h-3.5" />Payer
                      </button>
                    </div>
                  )}

                  {p.payments.length > 0 ? (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-muted-foreground mb-2">Historique des paiements</h5>
                      {p.payments.map(pay => (
                        <div key={pay.id} className="group flex items-center justify-between py-2.5 px-3 rounded-lg bg-card border border-border hover:border-primary/20 transition">
                          {editingPaymentId === pay.id ? (
                            <>
                              <div className="flex gap-2 flex-1 mr-2">
                                <input type="number" value={editPaymentAmount} onChange={e => setEditPaymentAmount(e.target.value)}
                                  className="w-28 h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                <input type="text" value={editPaymentNote} onChange={e => setEditPaymentNote(e.target.value)} placeholder="Note"
                                  className="flex-1 h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleUpdatePayment(p.id)} className="p-1.5 rounded-md bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/20 transition">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingPaymentId(null)} className="p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
                                  <DollarSign className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-foreground">{formatMoney(pay.amount)}</span>
                                  {pay.note && <span className="text-xs text-muted-foreground ml-2">— {pay.note}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{new Date(pay.date).toLocaleDateString('fr-FR')}</span>
                                <div className="flex items-center gap-0.5">
                                  <button onClick={() => startEditPayment(pay)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => setDeleteConfirm({ payableId: p.id, paymentId: pay.id })} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">Aucun paiement enregistré</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {paginated.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Aucun paiement à suivre</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Page {page} sur {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-secondary transition disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-secondary transition disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Delete payment confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce paiement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le montant payé sera recalculé automatiquement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Payables;
