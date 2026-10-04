import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, CreditCard, Landmark, RefreshCw, TrendingUp, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/integrations/supabase/client';
import { dashboardMetrics } from '@/lib/dashboardMetrics';

const money = (amount: number) => `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
const shortMoney = (amount: number) => amount >= 1_000_000 ? `${(amount / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M` : amount >= 1_000 ? `${Math.round(amount / 1_000)} k` : String(Math.round(amount));
const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const chartColors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))', 'hsl(var(--foreground))'];
const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, color: 'hsl(var(--foreground))' };

export default function Dashboard() {
  const { userId } = useAuth();
  const { data, loading, refresh } = useData();
  const [year, setYear] = useState(new Date().getFullYear());
  const [taxRate, setTaxRate] = useState(3);
  const [taxPaid, setTaxPaid] = useState(0);
  const [fiscalLoading, setFiscalLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [period, setPeriod] = useState('year');
  const [fiscalRefresh, setFiscalRefresh] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setFiscalLoading(true);
    supabase.from('fiscal_data').select('tax_rate,paiement_t1,paiement_t2,paiement_t3,paiement_t4').eq('year', year).maybeSingle().then(({ data: row, error }) => {
      if (!active) return;
      if (!error) {
        setTaxRate(Number(row?.tax_rate ?? 3));
        setTaxPaid(Number(row?.paiement_t1 || 0) + Number(row?.paiement_t2 || 0) + Number(row?.paiement_t3 || 0) + Number(row?.paiement_t4 || 0));
      }
      setFiscalLoading(false);
    });
    return () => { active = false; };
  }, [userId, year, fiscalRefresh]);

  const metrics = useMemo(() => dashboardMetrics(data.transactions, data.payables, year, taxRate, taxPaid), [data.transactions, data.payables, year, taxRate, taxPaid]);
  const categories = useMemo(() => [...new Set(metrics.yearly.map(t => t.category))].sort((a, b) => a.localeCompare(b, 'fr')), [metrics.yearly]);
  const visible = useMemo(() => metrics.yearly.filter(t => {
    if (type !== 'all' && t.type !== type) return false;
    if (category !== 'all' && t.category !== category) return false;
    if (period === 'month' && (year !== new Date().getFullYear() || Number(t.date.slice(5, 7)) !== new Date().getMonth() + 1)) return false;
    return true;
  }), [metrics.yearly, type, category, period, year]);

  const monthly = useMemo(() => months.map((name, index) => {
    const rows = visible.filter(t => Number(t.date.slice(5, 7)) === index + 1);
    return { name, revenus: rows.filter(t => t.type === 'revenu').reduce((sum, t) => sum + t.amount, 0), depenses: rows.filter(t => t.type === 'depense').reduce((sum, t) => sum + t.amount, 0) };
  }), [visible]);
  const breakdown = useMemo(() => {
    const groups = new Map<string, number>();
    visible.filter(t => t.type === 'depense').forEach(t => groups.set(t.category, (groups.get(t.category) || 0) + t.amount));
    return [...groups].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [visible]);
  const recent = useMemo(() => [...visible].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 6), [visible]);
  const yearOptions = useMemo(() => Array.from(new Set([new Date().getFullYear(), ...data.transactions.map(t => Number(t.date.slice(0, 4)))] )).filter(Number.isFinite).sort((a, b) => b - a), [data.transactions]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setFiscalRefresh(n => n + 1);
    setRefreshing(false);
  }, [refresh]);

  const controls = 'h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  const isLoading = loading || fiscalLoading;
  return (
    <div className="space-y-7 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Vue d’ensemble · {year}</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">Chiffres issus des transactions enregistrées</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="dashboard-year">Année</label>
          <select id="dashboard-year" value={year} onChange={e => setYear(Number(e.target.value))} className={controls}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="outline" size="icon" aria-label="Actualiser les données" title="Actualiser les données" onClick={handleRefresh} disabled={refreshing}><RefreshCw className={refreshing ? 'animate-spin' : ''} /></Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Chiffre d’affaires', value: metrics.revenue, icon: ArrowUpRight, tone: 'text-success bg-success/10', note: `${metrics.yearly.filter(t => t.type === 'revenu').length} encaissements` },
          { label: 'Dépenses', value: metrics.expenses, icon: ArrowDownRight, tone: 'text-destructive bg-destructive/10', note: `${metrics.yearly.filter(t => t.type === 'depense').length} sorties` },
          { label: 'Flux net', value: metrics.cashFlow, icon: Wallet, tone: 'text-primary bg-primary/10', note: 'Revenus − dépenses' },
          { label: 'Reste à payer (clients)', value: metrics.payableRemaining, icon: CreditCard, tone: 'text-warning bg-warning/10', note: 'Créances non encaissées' },
        ].map(item => (
          <div key={item.label} className="min-w-0 rounded-md border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{item.label}</p><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${item.tone}`}><item.icon className="h-4 w-4" /></span></div>
            <p className="mt-4 break-words text-2xl font-bold text-foreground">{isLoading ? '…' : money(item.value)}</p>
            <p className="mt-2 text-xs text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </div>

      <section className="border-y border-border py-5" aria-label="Synthèse fiscale">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Fiscalité {year}</h2><span className="text-xs text-muted-foreground">Taux {taxRate} %</span></div><Button variant="link" size="sm" asChild><Link to="/fiscalite">Voir le détail <ArrowRight /></Link></Button></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">Impôt calculé sur le CA</p><p className="mt-1 text-xl font-semibold">{isLoading ? '…' : money(metrics.tax)}</p></div>
          <div><p className="text-xs text-muted-foreground">Déjà payé</p><p className="mt-1 text-xl font-semibold">{isLoading ? '…' : money(metrics.taxPaid)}</p></div>
          <div><p className="text-xs text-muted-foreground">Reste dû estimé</p><p className="mt-1 text-xl font-semibold text-warning">{isLoading ? '…' : money(metrics.taxRemaining)}</p></div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><Activity className="h-5 w-5 text-primary" /> Analyse des transactions</h2><span className="text-xs text-muted-foreground">{visible.length} opération{visible.length > 1 ? 's' : ''}</span></div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="dashboard-period">Période</label>
          <select id="dashboard-period" className={controls} value={period} onChange={e => setPeriod(e.target.value)}><option value="year">Toute l’année</option><option value="month">Ce mois</option></select>
          <label className="sr-only" htmlFor="dashboard-type">Type</label>
          <select id="dashboard-type" className={controls} value={type} onChange={e => setType(e.target.value)}><option value="all">Tous les types</option><option value="revenu">Revenus</option><option value="depense">Dépenses</option></select>
          <label className="sr-only" htmlFor="dashboard-category">Catégorie</label>
          <select id="dashboard-category" className={`${controls} max-w-full`} value={category} onChange={e => setCategory(e.target.value)}><option value="all">Toutes les catégories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="min-w-0 border-t border-border pt-4"><h3 className="mb-5 text-sm font-semibold">Revenus et dépenses par mois</h3>
            <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barGap={2}><CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={shortMoney} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /><Bar dataKey="revenus" name="Revenus" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} maxBarSize={22} /><Bar dataKey="depenses" name="Dépenses" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} maxBarSize={22} /></BarChart></ResponsiveContainer></div>
            <div className="mt-3 flex justify-center gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-success" /> Revenus</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-destructive" /> Dépenses</span></div>
          </div>
          <div className="min-w-0 border-t border-border pt-4"><h3 className="mb-4 text-sm font-semibold">Dépenses par catégorie</h3>{breakdown.length ? <><div className="h-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={48} outerRadius={74} stroke="hsl(var(--card))" strokeWidth={2}>{breakdown.map((item, i) => <Cell key={item.name} fill={chartColors[i % chartColors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /></PieChart></ResponsiveContainer></div><div className="space-y-2">{breakdown.slice(0, 5).map((item, i) => <div key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2"><i className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: chartColors[i % chartColors.length] }} /><span className="truncate">{item.name}</span></span><span className="shrink-0 font-medium">{money(item.value)}</span></div>)}</div></> : <p className="py-20 text-center text-sm text-muted-foreground">Aucune dépense pour cette sélection</p>}</div>
        </div>
      </section>

      <section className="border-t border-border pt-5"><div className="mb-4 flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-semibold"><CalendarDays className="h-5 w-5 text-primary" /> Transactions récentes</h2><Button variant="link" size="sm" asChild><Link to="/transactions">Tout voir <ArrowRight /></Link></Button></div>
        {recent.length ? <div className="divide-y divide-border">{recent.map(t => <div key={t.id} className="flex items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${t.type === 'revenu' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{t.type === 'revenu' ? <TrendingUp className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{t.description || t.category}</p><p className="truncate text-xs text-muted-foreground">{t.category} · {new Date(`${t.date}T12:00:00`).toLocaleDateString('fr-FR')}</p></div></div><span className={`shrink-0 text-right text-xs font-semibold sm:text-sm ${t.type === 'revenu' ? 'text-success' : 'text-destructive'}`}>{t.type === 'revenu' ? '+' : '−'}{money(t.amount)}</span></div>)}</div> : <p className="py-10 text-center text-sm text-muted-foreground">Aucune transaction pour cette sélection</p>}
      </section>
    </div>
  );
}
