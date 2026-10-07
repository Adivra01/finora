import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertTriangle, TrendingUp, Calculator, ShieldAlert, FileDown, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, BarChart3, Wallet, Receipt, Lock, Plus, Pencil, Trash2, Tag,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const MONTHS = [
  { key: 'jan', label: 'Jan', full: 'Janvier' },
  { key: 'fev', label: 'Fév', full: 'Février' },
  { key: 'mar', label: 'Mar', full: 'Mars' },
  { key: 'avr', label: 'Avr', full: 'Avril' },
  { key: 'mai', label: 'Mai', full: 'Mai' },
  { key: 'juin', label: 'Juin', full: 'Juin' },
  { key: 'juil', label: 'Juil', full: 'Juillet' },
  { key: 'aout', label: 'Aoû', full: 'Août' },
  { key: 'sept', label: 'Sep', full: 'Septembre' },
  { key: 'oct', label: 'Oct', full: 'Octobre' },
  { key: 'nov', label: 'Nov', full: 'Novembre' },
  { key: 'dec', label: 'Déc', full: 'Décembre' },
] as const;

const QUARTERS = [
  { label: 'T1', period: 'Janvier – Mars', months: ['jan', 'fev', 'mar'], payKey: 'paiement_t1', color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20' },
  { label: 'T2', period: 'Avril – Juin', months: ['avr', 'mai', 'juin'], payKey: 'paiement_t2', color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' },
  { label: 'T3', period: 'Juillet – Septembre', months: ['juil', 'aout', 'sept'], payKey: 'paiement_t3', color: 'from-amber-500/10 to-amber-600/5 border-amber-500/20' },
  { label: 'T4', period: 'Octobre – Décembre', months: ['oct', 'nov', 'dec'], payKey: 'paiement_t4', color: 'from-purple-500/10 to-purple-600/5 border-purple-500/20' },
] as const;

const YEARS = Array.from({ length: 15 }, (_, i) => 2026 + i);
const SEUIL_TVA = 30_000_000;

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--info))', 'hsl(var(--destructive))', 'hsl(var(--foreground))'];
const PALETTE = [
  { bar: 'bg-primary', text: 'text-primary' },
  { bar: 'bg-warning', text: 'text-warning' },
  { bar: 'bg-success', text: 'text-success' },
  { bar: 'bg-info', text: 'text-info' },
  { bar: 'bg-destructive', text: 'text-destructive' },
  { bar: 'bg-foreground', text: 'text-foreground' },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
};

interface FiscalEntry {
  id: string;
  year: number;
  month: string;
  category_id: string | null;
  category_name: string;
  label: string;
  client: string;
  amount: number;
  entry_date: string | null;
}

const emptyForm = {
  id: '' as string | null,
  month: MONTHS[new Date().getMonth()].key as string,
  categoryId: '',
  label: '',
  client: '',
  amount: '',
  entryDate: '',
};

export default function Fiscalite() {
  const { userId } = useAuth();
  const { data: appData, deleteTransaction } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [payments, setPayments] = useState<Record<string, number>>({});
  const [locks, setLocks] = useState<Record<string, boolean>>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const [ratePct, setRatePct] = useState(3);
  const [rateInput, setRateInput] = useState('3');
  const TAUX = ratePct / 100;

  // CA = TOUS les revenus de l'année (identique au tableau de bord)
  const fiscalCats = useMemo(() => {
    const names = Array.from(new Set(
      appData.transactions.filter(t => t.type === 'revenu' && t.date?.startsWith(String(year))).map(t => t.category)
    )).sort();
    return names.map(n => ({ id: n, name: n }));
  }, [appData.transactions, year]);

  // ---------- Fetch ----------
  const entries: FiscalEntry[] = useMemo(() => {
    const names = new Set(fiscalCats.map(c => c.name));
    return appData.transactions
      .filter(t => t.type === 'revenu' && names.has(t.category) && t.date?.startsWith(String(year)))
      .map(t => {
        const mi = Math.max(0, Math.min(11, Number(t.date.slice(5, 7)) - 1));
        const [label, client] = (t.description || t.category).split(' — ');
        return {
          id: t.id, year, month: MONTHS[mi].key,
          category_id: fiscalCats.find(c => c.name === t.category)?.id || null,
          category_name: t.category, label: label || t.category, client: client || '',
          amount: t.amount, entry_date: t.date,
        };
      })
      .sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || ''));
  }, [appData.transactions, fiscalCats, year]);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data: row } = await supabase.from('fiscal_data').select('*').eq('year', year).maybeSingle();

    if (row) {
      setRecordId(row.id);
      const p: Record<string, number> = {};
      const lk: Record<string, boolean> = {};
      QUARTERS.forEach((q, i) => {
        p[q.payKey] = Number((row as any)[q.payKey]) || 0;
        lk[`locked_t${i + 1}`] = !!(row as any)[`locked_t${i + 1}`];
      });
      setPayments(p);
      setLocks(lk);
      const r = Number((row as any).tax_rate ?? 3);
      setRatePct(r); setRateInput(String(r));
    } else {
      setRecordId(null);
      setPayments({});
      setLocks({});
      setRatePct(3); setRateInput('3');
    }
    setLoading(false);
  }, [userId, year]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ---------- Helpers ----------
  const catColor = (name: string) => {
    const idx = fiscalCats.findIndex(c => c.name === name);
    return PALETTE[(idx < 0 ? 0 : idx) % PALETTE.length];
  };

  const monthTotal = (month: string) =>
    entries.filter(e => e.month === month).reduce((s, e) => s + e.amount, 0);

  const monthCatTotal = (month: string, cat: string) =>
    entries.filter(e => e.month === month && e.category_name === cat).reduce((s, e) => s + e.amount, 0);

  const catTotal = (cat: string) =>
    entries.filter(e => e.category_name === cat).reduce((s, e) => s + e.amount, 0);

  const isMonthLocked = (monthKey: string) => {
    for (let i = 0; i < QUARTERS.length; i++) {
      if ((QUARTERS[i].months as readonly string[]).includes(monthKey)) return !!locks[`locked_t${i + 1}`];
    }
    return false;
  };
  const now = new Date();
  const isMonthPast = (monthKey: string) => {
    if (year !== now.getFullYear()) return false;
    return MONTHS.findIndex(m => m.key === monthKey) < now.getMonth();
  };
  const isMonthDisabled = (monthKey: string) => isMonthLocked(monthKey) || isMonthPast(monthKey);

  // ---------- Fiscal data (payments / locks / legacy CA sync) ----------
  const ensureRecord = useCallback(async () => {
    if (recordId) return recordId;
    if (!userId) return null;
    const { data: row } = await supabase
      .from('fiscal_data')
      .insert({ user_id: userId, year })
      .select()
      .single();
    if (row) { setRecordId(row.id); return row.id; }
    return null;
  }, [recordId, userId, year]);


  const savePayment = useCallback(async (key: string, value: number) => {
    if (!userId) return;
    setSaving(true);
    const id = await ensureRecord();
    if (id) await supabase.from('fiscal_data').update({ [key]: value, updated_at: new Date().toISOString() } as any).eq('id', id);
    setSaving(false);
    toast({ title: '✓ Enregistré', description: 'Paiement mis à jour' });
  }, [userId, ensureRecord, toast]);

  const saveRate = useCallback(async () => {
    const v = parseFloat(rateInput.replace(',', '.'));
    if (isNaN(v) || v < 0 || v > 100) { toast({ title: 'Taux invalide', variant: 'destructive' }); return; }
    const id = await ensureRecord();
    if (id) await supabase.from('fiscal_data').update({ tax_rate: v } as any).eq('id', id);
    setRatePct(v);
    toast({ title: '✓ Taux mis à jour', description: `Impôt recalculé à ${v}% du CA ${year}` });
  }, [rateInput, ensureRecord, toast, year]);

  const lockQuarter = useCallback(async (qi: number) => {
    const id = await ensureRecord();
    if (!id) return;
    const lockKey = `locked_t${qi + 1}`;
    await supabase.from('fiscal_data').update({ [lockKey]: true, updated_at: new Date().toISOString() } as any).eq('id', id);
    setLocks(prev => ({ ...prev, [lockKey]: true }));
    toast({ title: '🔒 Trimestre validé', description: `Le ${QUARTERS[qi].label} est maintenant verrouillé.` });
  }, [ensureRecord, toast]);

  // ---------- Écritures = transactions de revenu ----------
  const openNew = (_categoryId?: string, _month?: string) => navigate('/transactions');
  const openEdit = (_e: FiscalEntry) => navigate('/transactions');
  const deleteEntry = async (e: FiscalEntry) => {
    if (isMonthDisabled(e.month)) { toast({ title: 'Mois verrouillé', variant: 'destructive' }); return; }
    if (!window.confirm(`Supprimer « ${e.label} » (${fmt(e.amount)}) ?`)) return;
    await deleteTransaction(e.id);
    toast({ title: 'Transaction supprimée' });
  };

  // Garde la synthèse CA mensuelle à jour dans la base
  useEffect(() => {
    if (loading || !userId) return;
    const t = setTimeout(async () => {
      const id = await ensureRecord();
      if (!id) return;
      const upd: Record<string, number> = {};
      MONTHS.forEach(m => { upd[`ca_${m.key}`] = entries.filter(e => e.month === m.key).reduce((s, e) => s + e.amount, 0); });
      await supabase.from('fiscal_data').update(upd as any).eq('id', id);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, loading, userId]);

  // ---------- Calculs ----------
  const quarterCA = QUARTERS.map(q => q.months.reduce((s, m) => s + monthTotal(m), 0));
  const quarterImpot = quarterCA.map(ca => ca * TAUX);
  const quarterPaid = QUARTERS.map(q => payments[q.payKey] || 0);

  const caAnnuel = quarterCA.reduce((a, b) => a + b, 0);
  const impotAnnuel = caAnnuel * TAUX;
  const totalPaye = quarterPaid.reduce((a, b) => a + b, 0);
  const solde = impotAnnuel - totalPaye;
  const progressPaiement = impotAnnuel > 0 ? Math.min(100, (totalPaye / impotAnnuel) * 100) : 0;

  const monthsFilled = MONTHS.filter(m => monthTotal(m.key) > 0).length;
  const moyenne = monthsFilled > 0 ? caAnnuel / monthsFilled : 0;
  const caProjecte = moyenne * 12;
  const impotProjecte = caProjecte * TAUX;
  const maxMonthCA = Math.max(...MONTHS.map(m => monthTotal(m.key)), 1);

  const alerts: { type: 'destructive' | 'default'; title: string; msg: string }[] = [];
  if (caAnnuel >= SEUIL_TVA) alerts.push({ type: 'destructive', title: 'Risque TVA (18%)', msg: `Votre CA annuel (${fmt(caAnnuel)}) dépasse le seuil de ${fmt(SEUIL_TVA)}.` });
  QUARTERS.forEach((q, i) => {
    if (i > 0 && quarterCA[i - 1] > 0 && quarterCA[i] > quarterCA[i - 1] * 1.5) {
      alerts.push({ type: 'default', title: `Forte croissance ${q.label}`, msg: `Le CA ${q.label} a augmenté de +50% vs trimestre précédent.` });
    }
    if (quarterImpot[i] > 0 && quarterPaid[i] < quarterImpot[i]) {
      alerts.push({ type: 'default', title: `Impôt ${q.label} non soldé`, msg: `Dû: ${fmt(quarterImpot[i])} — Payé: ${fmt(quarterPaid[i])}` });
    }
  });

  // ---------- PDF ----------
  const exportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const cats = fiscalCats.map(c => c.name);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fiscalité ${year}</title>
<style>
 *{margin:0;padding:0;box-sizing:border-box}
 body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a2e;padding:40px;background:#fff}
 .header{text-align:center;margin-bottom:28px;border-bottom:3px solid #3b82f6;padding-bottom:18px}
 .header h1{font-size:26px}.header p{color:#64748b;font-size:13px}
 .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
 .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center}
 .card .l{font-size:10px;color:#64748b;text-transform:uppercase}.card .v{font-size:19px;font-weight:700;margin-top:4px}
 .section{margin-bottom:26px}.section h2{font-size:15px;margin-bottom:10px;border-left:4px solid #3b82f6;padding-left:10px}
 table{width:100%;border-collapse:collapse;font-size:12px}
 th{background:#f1f5f9;text-align:left;padding:8px 10px;color:#475569;border-bottom:2px solid #e2e8f0}
 td{padding:7px 10px;border-bottom:1px solid #f1f5f9}
 .r{text-align:right}.b{font-weight:700}
 .footer{margin-top:32px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:14px}
</style></head><body>
<div class="header"><h1>📊 Récapitulatif Fiscal ${year}</h1>
<p>Régime Simplifié — Bamako — Taux ${ratePct}% | Généré le ${new Date().toLocaleDateString('fr-FR')}</p></div>
<div class="grid">
 <div class="card"><div class="l">CA Annuel</div><div class="v">${fmt(caAnnuel)}</div></div>
 <div class="card"><div class="l">Impôt Annuel</div><div class="v">${fmt(impotAnnuel)}</div></div>
 <div class="card"><div class="l">Total Payé</div><div class="v">${fmt(totalPaye)}</div></div>
 <div class="card"><div class="l">Solde</div><div class="v">${fmt(solde)}</div></div>
</div>
<div class="section"><h2>Chiffre d'affaires mensuel par activité</h2><table>
<tr><th>Mois</th>${cats.map(c => `<th class="r">${c}</th>`).join('')}<th class="r">CA Total</th><th class="r">Impôt (${ratePct}%)</th></tr>
${MONTHS.map(m => `<tr><td>${m.full}</td>${cats.map(c => `<td class="r">${fmt(monthCatTotal(m.key, c))}</td>`).join('')}<td class="r b">${fmt(monthTotal(m.key))}</td><td class="r">${fmt(monthTotal(m.key) * TAUX)}</td></tr>`).join('')}
<tr class="b" style="background:#e8f0fe"><td>Total</td>${cats.map(c => `<td class="r">${fmt(catTotal(c))}</td>`).join('')}<td class="r">${fmt(caAnnuel)}</td><td class="r">${fmt(impotAnnuel)}</td></tr>
</table></div>
<div class="section"><h2>Détail des écritures</h2><table>
<tr><th>Mois</th><th>Activité</th><th>Détail</th><th>Client</th><th class="r">Montant</th></tr>
${MONTHS.flatMap(m => entries.filter(e => e.month === m.key).map(e =>
  `<tr><td>${m.full}</td><td>${e.category_name}</td><td>${e.label}</td><td>${e.client || '—'}</td><td class="r b">${fmt(e.amount)}</td></tr>`)).join('') || '<tr><td colspan="5">Aucune écriture</td></tr>'}
</table></div>
<div class="section"><h2>Détail trimestriel</h2><table>
<tr><th>Trimestre</th><th class="r">CA</th><th class="r">Impôt dû</th><th class="r">Payé</th><th class="r">Reste</th></tr>
${QUARTERS.map((q, i) => `<tr><td>${q.label} (${q.period})</td><td class="r b">${fmt(quarterCA[i])}</td><td class="r">${fmt(quarterImpot[i])}</td><td class="r">${fmt(quarterPaid[i])}</td><td class="r b">${fmt(Math.max(0, quarterImpot[i] - quarterPaid[i]))}</td></tr>`).join('')}
</table></div>
<div class="section"><h2>Projections</h2><table>
<tr><td>Moyenne mensuelle (${monthsFilled} mois)</td><td class="r b">${fmt(moyenne)}</td></tr>
<tr><td>CA projeté (12 mois)</td><td class="r b">${fmt(caProjecte)}</td></tr>
<tr><td>Impôt projeté</td><td class="r b">${fmt(impotProjecte)}</td></tr>
</table></div>
<div class="footer">FinTrack — Document généré automatiquement. Ne constitue pas un document fiscal officiel.</div>
</body></html>`;
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const chartData = MONTHS.map(m => ({
    month: m.label,
    ...Object.fromEntries(fiscalCats.map(c => [c.name, monthCatTotal(m.key, c.name)])),
  }));
  const renderEntryRow = (e: FiscalEntry, showCat = true) => (
    <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium">{e.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{showCat && `${e.category_name} · `}{e.client && `${e.client} · `}{e.entry_date ? new Date(e.entry_date).toLocaleDateString('fr-FR') : ''}</p>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${catColor(e.category_name).text}`}>{fmt(e.amount)}</span>
    </div>
  );
  const monthsAccordion = (catName?: string) => (
    <Accordion type="multiple" className="w-full">
      {MONTHS.map((m, index) => {
        const list = entries.filter(e => e.month === m.key && (!catName || e.category_name === catName));
        const total = list.reduce((s, e) => s + e.amount, 0);
        const disabled = isMonthDisabled(m.key);
        return <AccordionItem key={m.key} value={m.key} className="border-border">
          <AccordionTrigger className="px-3 py-3 text-left hover:bg-muted/40 hover:no-underline sm:px-5">
            <div className="flex w-full items-center justify-between gap-2 pr-3">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <span className="hidden w-5 text-xs tabular-nums text-muted-foreground sm:block">{String(index + 1).padStart(2, '0')}</span>
                <div><span className={`flex items-center gap-1.5 text-sm font-semibold ${disabled ? 'text-muted-foreground' : 'text-foreground'}`}>{m.full}{disabled && <Lock className="h-3 w-3" />}</span>
                  <span className="text-xs text-muted-foreground">{list.length} transaction{list.length > 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="shrink-0 text-right"><p className="font-display text-xs font-bold tabular-nums sm:text-sm">{fmt(total)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">Impôt : {fmt(total * TAUX)}</p></div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-muted/25 pb-0">
            {list.length ? list.map(e => renderEntryRow(e, !catName)) : <p className="px-5 py-4 text-xs text-muted-foreground">Aucune transaction fiscale pour ce mois.</p>}
          </AccordionContent>
        </AccordionItem>;
      })}
    </Accordion>
  );

  return (
    <div className="fiscal-page mx-auto max-w-7xl space-y-5 bg-background pb-8">
      <header className="dashboard-enter flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div><div className="mb-2 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground"><Receipt className="h-6 w-6" /></span><h1 className="font-display text-3xl font-bold">Fiscalité</h1></div><p className="text-xs text-muted-foreground sm:text-sm">Régime simplifié · Bamako · Exercice {year}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 items-center gap-1 rounded-md border border-border bg-card pl-3">
            <Label htmlFor="fiscal-rate" className="text-xs text-muted-foreground">Taux impôt</Label>
            <Input id="fiscal-rate" type="number" step="0.1" min="0" max="100" value={rateInput} onChange={e => setRateInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveRate(); }} className="h-8 w-14 border-0 bg-transparent px-1 text-center font-bold text-primary shadow-none" />
            <span className="text-xs text-muted-foreground">%</span><Button size="icon" variant="ghost" aria-label="Enregistrer le taux" title="Enregistrer le taux" className="h-8 w-8" onClick={saveRate} disabled={parseFloat(rateInput) === ratePct}><CheckCircle2 className="h-4 w-4" /></Button>
          </div>
          <div className="flex h-10 items-center rounded-md border border-border bg-card">
            <Button variant="ghost" size="icon" aria-label="Année précédente" className="h-8 w-8" onClick={() => setYear(y => Math.max(2026, y - 1))} disabled={year <= 2026}><ChevronLeft className="h-4 w-4" /></Button>
            <label className="sr-only" htmlFor="fiscal-year">Année fiscale</label><select id="fiscal-year" value={year} onChange={e => setYear(Number(e.target.value))} className="bg-card px-1 text-sm font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
            <Button variant="ghost" size="icon" aria-label="Année suivante" className="h-8 w-8" onClick={() => setYear(y => Math.min(2040, y + 1))} disabled={year >= 2040}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button onClick={exportPDF} className="h-10 gap-2 rounded-md bg-foreground text-background hover:bg-foreground/90"><FileDown className="h-4 w-4" />Export PDF</Button>
          {saving && <span role="status" className="text-xs text-muted-foreground">Sauvegarde…</span>}
        </div>
      </header>

      {alerts.length > 0 && <div className="grid gap-2 md:grid-cols-3">{alerts.map((a, i) => <Alert key={i} variant={a.type} className={`dashboard-enter fiscal-step rounded-md border-l-4 ${a.type === 'default' ? 'border-l-warning bg-warning/5' : 'border-l-destructive'}`}>
        {a.type === 'destructive' ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4 text-warning" />}<AlertTitle className="font-display text-xs font-bold">{a.title}</AlertTitle><AlertDescription className="text-[11px] leading-5 text-muted-foreground">{a.msg}</AlertDescription>
      </Alert>)}</div>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'CA annuel', value: caAnnuel, icon: TrendingUp, tone: 'text-primary bg-primary/10' },
          { label: `Impôt (${ratePct} %)`, value: impotAnnuel, icon: Calculator, tone: 'text-warning bg-warning/10' },
          { label: 'Total payé', value: totalPaye, icon: Wallet, tone: 'text-success bg-success/10' },
          { label: 'Solde dû', value: solde, icon: solde > 0 ? XCircle : CheckCircle2, tone: solde > 0 ? 'text-destructive bg-destructive/10' : 'text-success bg-success/10' },
        ].map((k, i) => <article key={k.label} className={`dashboard-enter fiscal-step min-w-0 rounded-md border p-4 transition-transform duration-200 motion-safe:hover:-translate-y-1 sm:p-5 ${i === 3 && solde > 0 ? 'border-destructive/20 bg-destructive/5' : 'border-border bg-card'}`}>
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-md ${k.tone}`}><k.icon className="h-4 w-4" /></span><span className="text-[10px] font-bold uppercase text-muted-foreground sm:text-xs">{k.label}</span></div>
          <p className={`font-display text-3xl font-bold tabular-nums ${i === 3 && solde > 0 ? 'text-destructive' : 'text-foreground'}`}>{fmtShort(k.value)}</p><p className="mt-1 break-words text-xs tabular-nums text-muted-foreground">{fmt(k.value)}</p>
        </article>)}
      </div>

      <section className="dashboard-chart-enter min-w-0" aria-label="Chiffre d’affaires mensuel">
        <div className="border-x border-t border-border bg-card px-3 pt-5 sm:px-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-display text-lg font-bold"><span className="h-5 w-1 rounded-sm bg-primary" />Chiffre d’affaires mensuel détaillé</h2><span className="text-xs text-muted-foreground">{entries.length} transactions · FCFA</span></div>
          {fiscalCats.length ? <>
            <div className="h-64 w-full sm:h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 15, right: 4, left: -16, bottom: 0 }}><CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} interval={0} /><YAxis width={55} axisLine={false} tickLine={false} tickFormatter={fmtShort} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} /><Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, color: 'hsl(var(--foreground))' }} formatter={(v: number) => fmt(v)} />{fiscalCats.map((c, i) => <Bar key={c.id} dataKey={c.name} stackId="revenue" fill={CHART_COLORS[i % CHART_COLORS.length]} maxBarSize={36} animationDuration={800} isAnimationActive={!reducedMotion} />)}</BarChart></ResponsiveContainer></div>
            <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">{fiscalCats.map((c, i) => <span key={c.id} className="flex items-center gap-1.5"><i className={`h-2 w-2 rounded-sm ${PALETTE[i % PALETTE.length].bar}`} />{c.name}</span>)}</div>
          </> : <p className="py-16 text-center text-sm text-muted-foreground">Aucun revenu pour {year}</p>}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-1 rounded-none bg-transparent p-0"><TabsTrigger value="all" className="rounded-md border border-border px-3 py-2 text-xs data-[state=active]:bg-foreground data-[state=active]:text-background">Toutes activités</TabsTrigger>{fiscalCats.map(c => <TabsTrigger key={c.id} value={c.id} className="max-w-full whitespace-normal rounded-md border border-border px-3 py-2 text-xs data-[state=active]:bg-foreground data-[state=active]:text-background">{c.name}</TabsTrigger>)}</TabsList>
            <TabsContent value="all" className="-mx-3 sm:-mx-5">{monthsAccordion()}<div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 px-5 py-4"><span className="text-xs font-bold uppercase text-muted-foreground">Total {year}</span><span className="font-display text-lg font-bold tabular-nums text-primary">{fmt(caAnnuel)}</span></div></TabsContent>
            {fiscalCats.map(c => <TabsContent key={c.id} value={c.id} className="-mx-3 sm:-mx-5">{monthsAccordion(c.name)}<div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 px-5 py-4"><span className="text-xs font-bold text-muted-foreground">Total {c.name}</span><span className="font-display text-lg font-bold tabular-nums text-primary">{fmt(catTotal(c.name))}</span></div></TabsContent>)}
          </Tabs>
        </div>
      </section>

      <section className="dashboard-enter space-y-3" aria-label="Paiements trimestriels">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-bold">Paiements trimestriels</h2><span className="text-xs text-muted-foreground">Exercice {year}</span></div>
        <div className="border-y border-border py-3"><div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium">Progression des paiements</span><span className="font-bold text-primary">{progressPaiement.toFixed(0)} %</span></div><Progress value={progressPaiement} className="h-2" /><div className="mt-2 flex flex-wrap justify-between gap-1 text-xs text-muted-foreground"><span>Payé : {fmt(totalPaye)}</span><span>Total dû : {fmt(impotAnnuel)}</span></div></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{QUARTERS.map((q, i) => {
          const reste = Math.max(0, quarterImpot[i] - quarterPaid[i]);
          const paid = quarterImpot[i] > 0 && quarterPaid[i] >= quarterImpot[i];
          const progress = quarterImpot[i] > 0 ? Math.min(100, (quarterPaid[i] / quarterImpot[i]) * 100) : 0;
          const isLocked = !!locks[`locked_t${i + 1}`];
          return <article key={q.label} className="min-w-0 rounded-md border border-border bg-card p-4">
            <div className="mb-4 flex items-start justify-between gap-2"><div><h3 className="font-display text-xl font-bold">{q.label}</h3><p className="text-[11px] text-muted-foreground">{q.period}</p></div><Badge variant="secondary" className={`gap-1 rounded-sm text-[10px] ${paid || isLocked ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{isLocked ? <Lock className="h-3 w-3" /> : paid ? <CheckCircle2 className="h-3 w-3" /> : null}{isLocked ? 'Validé' : paid ? 'Soldé' : 'En cours'}</Badge></div>
            <div className="space-y-2 text-xs"><div className="flex flex-wrap justify-between gap-1"><span className="text-muted-foreground">CA</span><span className="font-semibold tabular-nums">{fmt(quarterCA[i])}</span></div><div className="flex flex-wrap justify-between gap-1"><span className="text-muted-foreground">Impôt dû</span><span className="font-semibold tabular-nums">{fmt(quarterImpot[i])}</span></div></div>
            <div className="mt-4"><Label htmlFor={q.payKey} className="text-xs text-muted-foreground">Montant payé · FCFA</Label><Input id={q.payKey} type="number" min={0} value={payments[q.payKey] || ''} placeholder="0" onChange={e => setPayments(prev => ({ ...prev, [q.payKey]: Math.max(0, Number(e.target.value) || 0) }))} onBlur={() => savePayment(q.payKey, payments[q.payKey] || 0)} className="mt-1 h-9 rounded-md tabular-nums" disabled={isLocked} /></div>
            <div className="mt-3"><div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>Progression</span><span>{progress.toFixed(0)} %</span></div><Progress value={progress} className="h-1.5" /></div>
            <div className="mt-4 flex flex-wrap justify-between gap-1 border-t border-border pt-3 text-xs"><span className="text-muted-foreground">Reste à payer</span><span className={`font-bold tabular-nums ${reste > 0 ? 'text-destructive' : 'text-success'}`}>{fmt(reste)}</span></div>
            {!isLocked && quarterCA[i] > 0 && <Button variant={paid ? 'default' : 'outline'} size="sm" className="mt-3 h-auto min-h-9 w-full gap-1 rounded-md px-2 py-2 text-[11px] whitespace-normal" onClick={() => { if (window.confirm(`Êtes-vous sûr de vouloir valider le ${q.label} ? Les données ne seront plus modifiables.`)) lockQuarter(i); }}><Lock className="h-3 w-3 shrink-0" />Valider & Verrouiller {q.label}</Button>}
            {isLocked && <p className="mt-3 flex items-center gap-1 text-[11px] text-success"><Lock className="h-3 w-3" />Trimestre validé — Lecture seule</p>}
          </article>;
        })}</div>
      </section>
      <section className="border-t border-border pt-4"><h2 className="mb-3 font-display text-lg font-bold">Projections {year}</h2><div className="grid gap-4 sm:grid-cols-3">{[[`Moyenne mensuelle (${monthsFilled} mois)`, moyenne], ['CA projeté (12 mois)', caProjecte], ['Impôt projeté', impotProjecte]].map(([label, value]) => <div key={String(label)}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-lg font-bold tabular-nums">{fmt(Number(value))}</p></div>)}</div></section>
    </div>
  );
}
