import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Landmark,
  PiggyBank,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';
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
const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))', boxShadow: '0 8px 24px hsl(var(--foreground) / 0.08)' };

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

  const metrics = useMemo(() => dashboardMetrics(data.transactions, data.payables, year, taxRate, taxPaid, data.investments), [data.transactions, data.payables, data.investments, year, taxRate, taxPaid]);
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
  const visibleExpenses = breakdown.reduce((sum, item) => sum + item.value, 0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setFiscalRefresh(n => n + 1);
    setRefreshing(false);
  }, [refresh]);

  const controls = 'h-9 rounded-sm border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring';
  const isLoading = loading || fiscalLoading;
  const stats = [
    { label: 'Chiffre d’affaires', value: metrics.revenue, icon: ArrowUpRight, tone: 'text-success bg-success/10', note: `${metrics.yearly.filter(t => t.type === 'revenu').length} encaissements` },
    { label: 'Dépenses', value: metrics.expenses, icon: ArrowDownRight, tone: 'text-destructive bg-destructive/10', note: `${metrics.yearly.filter(t => t.type === 'depense').length} sorties` },
    { label: 'Investissements', value: metrics.invested, icon: PiggyBank, tone: 'text-info bg-info/10', note: `Total investi : ${money(metrics.investedTotal)}` },
    { label: 'Flux net', value: metrics.cashFlow, icon: Wallet, tone: 'text-primary bg-primary/10', note: 'Revenus − dépenses − investissements' },
    { label: 'Reste à encaisser', value: metrics.payableRemaining, icon: CreditCard, tone: 'text-warning bg-warning/10', note: 'Créances clients non encaissées' },
  ];

  return (
    <div className="space-y-5 pb-8">
      <header className="dashboard-enter flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-primary">Vue d’ensemble · {year}</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">Synthèse des flux financiers en temps réel</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="dashboard-year">Année</label>
          <select id="dashboard-year" value={year} onChange={e => setYear(Number(e.target.value))} className={controls}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-sm bg-card" aria-label="Actualiser les données" title="Actualiser les données" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item, i) => (
          <article key={item.label} style={{ animationDelay: `${80 + i * 70}ms` }} className="dashboard-enter group min-w-0 rounded-sm border border-border bg-card p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${item.tone}`}><item.icon className="h-4 w-4" /></span>
              <span className="text-right text-xs font-medium text-muted-foreground">{item.label}</span>
            </div>
            <p className="break-words font-display text-xl font-bold tabular-nums text-foreground">{isLoading ? '…' : money(item.value)}</p>
            <p className="mt-2 min-h-8 text-xs leading-4 text-muted-foreground">{item.note}</p>
          </article>
        ))}
      </div>

      <section style={{ animationDelay: '440ms' }} className="dashboard-enter relative overflow-hidden rounded-sm bg-fiscal p-5 text-fiscal-foreground shadow-sm" aria-label="Synthèse fiscale">
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center gap-3 sm:border-r sm:border-fiscal-foreground/15 sm:pr-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-fiscal-foreground/10 text-primary"><Landmark className="h-5 w-5" /></span>
              <div><p className="text-xs font-bold uppercase text-fiscal-foreground/55">Fiscalité {year}</p><p className="text-sm font-semibold">Taux appliqué : {taxRate} %</p></div>
            </div>
            {[
              ['Impôt calculé', metrics.tax, 'text-fiscal-foreground'],
              ['Déjà payé', metrics.taxPaid, 'text-fiscal-foreground/65'],
              ['Reste dû estimé', metrics.taxRemaining, 'text-warning'],
            ].map(([label, value, tone]) => (
              <div key={String(label)}><p className="text-xs font-medium uppercase text-fiscal-foreground/55">{label}</p><p className={`mt-1 font-display text-lg font-bold tabular-nums ${tone}`}>{isLoading ? '…' : money(Number(value))}</p></div>
            ))}
          </div>
          <Button variant="link" size="sm" className="w-fit px-0 text-primary hover:text-primary/80" asChild><Link to="/fiscalite">Voir le détail <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        <Landmark className="absolute -bottom-10 right-14 h-40 w-40 text-fiscal-foreground/[0.03]" aria-hidden="true" />
      </section>

      <section style={{ animationDelay: '520ms' }} className="dashboard-chart-enter space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="font-display text-lg font-bold">Analyse des transactions</h2><p className="text-xs text-muted-foreground">Comparaison mensuelle consolidée · {visible.length} opération{visible.length > 1 ? 's' : ''}</p></div>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="dashboard-period">Période</label>
            <select id="dashboard-period" className={controls} value={period} onChange={e => setPeriod(e.target.value)}><option value="year">Toute l’année</option><option value="month">Ce mois</option></select>
            <label className="sr-only" htmlFor="dashboard-type">Type</label>
            <select id="dashboard-type" className={controls} value={type} onChange={e => setType(e.target.value)}><option value="all">Tous les types</option><option value="revenu">Revenus</option><option value="depense">Dépenses</option></select>
            <label className="sr-only" htmlFor="dashboard-category">Catégorie</label>
            <select id="dashboard-category" className={`${controls} max-w-full`} value={category} onChange={e => setCategory(e.target.value)}><option value="all">Toutes les catégories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="min-w-0 rounded-sm border border-border bg-card p-4 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">Revenus et dépenses</h3><p className="text-xs text-muted-foreground">Évolution mensuelle en FCFA</p></div><div className="flex gap-4 text-xs font-medium text-muted-foreground"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-success" />Revenus</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-destructive" />Dépenses</span></div></div>
            <div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} margin={{ top: 8, right: 4, left: -10, bottom: 0 }} barGap={3}><CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} /><YAxis tickFormatter={shortMoney} width={48} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.55)' }} contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /><Bar dataKey="revenus" name="Revenus" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} maxBarSize={20} animationDuration={850} /><Bar dataKey="depenses" name="Dépenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} maxBarSize={20} animationDuration={1000} /></BarChart></ResponsiveContainer></div>
          </div>

          <div className="min-w-0 rounded-sm border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Dépenses par catégorie</h3><p className="text-xs text-muted-foreground">Répartition de la sélection</p>
            {breakdown.length ? <><div className="relative mx-auto h-44 max-w-60"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={54} outerRadius={72} paddingAngle={2} stroke="hsl(var(--card))" strokeWidth={2} animationDuration={900}>{breakdown.map((item, i) => <Cell key={item.name} fill={chartColors[i % chartColors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => money(value)} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs text-muted-foreground">Total</span><span className="font-display text-sm font-bold tabular-nums">{shortMoney(visibleExpenses)}</span></div></div><div className="space-y-2">{breakdown.slice(0, 5).map((item, i) => <div key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2"><i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} /><span className="truncate text-muted-foreground">{item.name}</span></span><span className="shrink-0 font-semibold tabular-nums">{money(item.value)}</span></div>)}</div></> : <p className="py-24 text-center text-sm text-muted-foreground">Aucune dépense pour cette sélection</p>}
          </div>
        </div>
      </section>

      <section style={{ animationDelay: '620ms' }} className="dashboard-enter overflow-hidden rounded-sm border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/35 px-4 py-3"><div><h2 className="flex items-center gap-2 font-display text-base font-bold"><CalendarDays className="h-4 w-4 text-primary" /> Transactions récentes</h2><p className="mt-0.5 text-xs text-muted-foreground">Les dernières opérations de la sélection</p></div><Button variant="link" size="sm" asChild><Link to="/transactions">Tout voir <ArrowRight className="h-4 w-4" /></Link></Button></div>
        {recent.length ? <div className="divide-y divide-border">{recent.map(t => <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/35"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.type === 'revenu' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{t.type === 'revenu' ? <TrendingUp className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{t.description || t.category}</p><p className="truncate text-xs text-muted-foreground">{t.category} · {new Date(`${t.date}T12:00:00`).toLocaleDateString('fr-FR')}</p></div></div><span className={`shrink-0 text-right text-xs font-bold tabular-nums sm:text-sm ${t.type === 'revenu' ? 'text-success' : 'text-destructive'}`}>{t.type === 'revenu' ? '+' : '−'}{money(t.amount)}</span></div>)}</div> : <p className="py-10 text-center text-sm text-muted-foreground">Aucune transaction pour cette sélection</p>}
      </section>
    </div>
  );
}