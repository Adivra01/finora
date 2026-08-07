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
import { Link } from 'react-router-dom';

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
const TAUX = 0.06;
const SEUIL_TVA = 30_000_000;

const PALETTE = [
  { bar: 'bg-primary', grad: 'from-primary to-primary/60', text: 'text-primary' },
  { bar: 'bg-amber-500', grad: 'from-amber-500 to-amber-400/60', text: 'text-amber-600' },
  { bar: 'bg-violet-500', grad: 'from-violet-500 to-violet-400/60', text: 'text-violet-600' },
  { bar: 'bg-cyan-500', grad: 'from-cyan-500 to-cyan-400/60', text: 'text-cyan-600' },
  { bar: 'bg-rose-500', grad: 'from-rose-500 to-rose-400/60', text: 'text-rose-600' },
  { bar: 'bg-lime-500', grad: 'from-lime-500 to-lime-400/60', text: 'text-lime-600' },
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
  const { data: appData } = useData();
  const { toast } = useToast();
  const [year, setYear] = useState(new Date().getFullYear());
  const [entries, setEntries] = useState<FiscalEntry[]>([]);
  const [payments, setPayments] = useState<Record<string, number>>({});
  const [locks, setLocks] = useState<Record<string, boolean>>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fiscalCats = useMemo(
    () => appData.categories.filter(c => c.group === 'fiscalite'),
    [appData.categories]
  );

  // ---------- Fetch ----------
  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data: row }, { data: rows }] = await Promise.all([
      supabase.from('fiscal_data').select('*').eq('year', year).maybeSingle(),
      supabase.from('fiscal_entries').select('*').eq('year', year).order('created_at', { ascending: false }),
    ]);

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
    } else {
      setRecordId(null);
      setPayments({});
      setLocks({});
    }

    setEntries(
      (rows || []).map((r: any) => ({
        id: r.id,
        year: r.year,
        month: r.month,
        category_id: r.category_id,
        category_name: r.category_name,
        label: r.label || '',
        client: r.client || '',
        amount: Number(r.amount) || 0,
        entry_date: r.entry_date,
      }))
    );
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
    const { data: row } = await supabase
      .from('fiscal_data')
      .insert({ user_id: userId!, year })
      .select()
      .single();
    if (row) { setRecordId(row.id); return row.id; }
    return null;
  }, [recordId, userId, year]);

  const syncMonthCA = useCallback(async (month: string, list: FiscalEntry[]) => {
    const id = await ensureRecord();
    if (!id) return;
    const total = list.filter(e => e.month === month).reduce((s, e) => s + e.amount, 0);
    await supabase.from('fiscal_data').update({ [`ca_${month}`]: total, updated_at: new Date().toISOString() } as any).eq('id', id);
  }, [ensureRecord]);

  const savePayment = useCallback(async (key: string, value: number) => {
    if (!userId) return;
    setSaving(true);
    const id = await ensureRecord();
    if (id) await supabase.from('fiscal_data').update({ [key]: value, updated_at: new Date().toISOString() } as any).eq('id', id);
    setSaving(false);
    toast({ title: '✓ Enregistré', description: 'Paiement mis à jour' });
  }, [userId, ensureRecord, toast]);

  const lockQuarter = useCallback(async (qi: number) => {
    const id = await ensureRecord();
    if (!id) return;
    const lockKey = `locked_t${qi + 1}`;
    await supabase.from('fiscal_data').update({ [lockKey]: true, updated_at: new Date().toISOString() } as any).eq('id', id);
    setLocks(prev => ({ ...prev, [lockKey]: true }));
    toast({ title: '🔒 Trimestre validé', description: `Le ${QUARTERS[qi].label} est maintenant verrouillé.` });
  }, [ensureRecord, toast]);

  // ---------- Entry CRUD ----------
  const openNew = (categoryId?: string, month?: string) => {
    setForm({
      ...emptyForm,
      categoryId: categoryId || fiscalCats[0]?.id || '',
      month: month || MONTHS[Math.min(now.getMonth(), 11)].key,
    });
    setDialogOpen(true);
  };

  const openEdit = (e: FiscalEntry) => {
    setForm({
      id: e.id,
      month: e.month,
      categoryId: e.category_id || fiscalCats.find(c => c.name === e.category_name)?.id || '',
      label: e.label,
      client: e.client,
      amount: String(e.amount),
      entryDate: e.entry_date || '',
    });
    setDialogOpen(true);
  };

  const submitEntry = async () => {
    if (!userId) return;
    const cat = fiscalCats.find(c => c.id === form.categoryId);
    if (!cat) { toast({ title: 'Activité requise', description: 'Ajoutez une activité dans Catégories > Fiscalité.', variant: 'destructive' }); return; }
    const amount = Math.max(0, Number(form.amount) || 0);
    if (!form.label.trim()) { toast({ title: 'Détail requis', description: 'Indiquez la prestation (ex: site web, maintenance…).', variant: 'destructive' }); return; }
    if (isMonthDisabled(form.month)) { toast({ title: 'Mois verrouillé', description: 'Ce mois n\'est plus modifiable.', variant: 'destructive' }); return; }

    setSaving(true);
    const payload = {
      user_id: userId,
      year,
      month: form.month,
      category_id: cat.id,
      category_name: cat.name,
      label: form.label.trim(),
      client: form.client.trim(),
      amount,
      entry_date: form.entryDate || null,
    };

    let next: FiscalEntry[] = entries;
    if (form.id) {
      const { data: row } = await supabase.from('fiscal_entries').update(payload).eq('id', form.id).select().single();
      if (row) next = entries.map(e => (e.id === form.id ? { ...(row as any), amount: Number(row.amount) } : e));
    } else {
      const { data: row } = await supabase.from('fiscal_entries').insert(payload).select().single();
      if (row) next = [{ ...(row as any), amount: Number(row.amount) }, ...entries];
    }
    setEntries(next);
    await syncMonthCA(form.month, next);
    setSaving(false);
    setDialogOpen(false);
    toast({ title: '✓ Écriture enregistrée', description: `${cat.name} — ${fmt(amount)}` });
  };

  const deleteEntry = async (e: FiscalEntry) => {
    if (isMonthDisabled(e.month)) { toast({ title: 'Mois verrouillé', variant: 'destructive' }); return; }
    if (!window.confirm(`Supprimer « ${e.label} » (${fmt(e.amount)}) ?`)) return;
    await supabase.from('fiscal_entries').delete().eq('id', e.id);
    const next = entries.filter(x => x.id !== e.id);
    setEntries(next);
    await syncMonthCA(e.month, next);
    toast({ title: 'Écriture supprimée' });
  };

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
<p>Régime Simplifié — Bamako — Taux 6% | Généré le ${new Date().toLocaleDateString('fr-FR')}</p></div>
<div class="grid">
 <div class="card"><div class="l">CA Annuel</div><div class="v">${fmt(caAnnuel)}</div></div>
 <div class="card"><div class="l">Impôt Annuel</div><div class="v">${fmt(impotAnnuel)}</div></div>
 <div class="card"><div class="l">Total Payé</div><div class="v">${fmt(totalPaye)}</div></div>
 <div class="card"><div class="l">Solde</div><div class="v">${fmt(solde)}</div></div>
</div>
<div class="section"><h2>Chiffre d'affaires mensuel par activité</h2><table>
<tr><th>Mois</th>${cats.map(c => `<th class="r">${c}</th>`).join('')}<th class="r">CA Total</th><th class="r">Impôt (6%)</th></tr>
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

  const renderEntryRow = (e: FiscalEntry, showCat = true) => (
    <div key={e.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">{e.label}</span>
          {showCat && <Badge variant="secondary" className="text-[10px]">{e.category_name}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {e.client ? `${e.client} · ` : ''}{e.entry_date ? new Date(e.entry_date).toLocaleDateString('fr-FR') : MONTHS.find(m => m.key === e.month)?.full}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-bold ${catColor(e.category_name).text}`}>{fmt(e.amount)}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isMonthDisabled(e.month)} onClick={() => openEdit(e)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={isMonthDisabled(e.month)} onClick={() => deleteEntry(e)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );

  const monthsAccordion = (catName?: string) => (
    <Accordion type="multiple" className="w-full">
      {MONTHS.map(m => {
        const list = entries.filter(e => e.month === m.key && (!catName || e.category_name === catName));
        const total = list.reduce((s, e) => s + e.amount, 0);
        const disabled = isMonthDisabled(m.key);
        return (
          <AccordionItem key={m.key} value={m.key}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {m.full}
                  {disabled && <Lock className="w-3 h-3 text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground">({list.length})</span>
                </span>
                <span className="text-sm font-bold">{fmt(total)}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2">
              {list.length === 0 && <p className="text-xs text-muted-foreground py-2">Aucune écriture pour ce mois.</p>}
              {list.map(e => renderEntryRow(e, !catName))}
              {!disabled && (
                <Button variant="outline" size="sm" className="gap-1.5 mt-1"
                  onClick={() => openNew(catName ? fiscalCats.find(c => c.name === catName)?.id : undefined, m.key)}>
                  <Plus className="w-3.5 h-3.5" /> Ajouter une écriture
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
            <Receipt className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fiscalité</h1>
            <p className="text-sm text-muted-foreground">Régime simplifié — Bamako — Taux 6%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {saving && <Badge variant="secondary" className="animate-pulse">Sauvegarde...</Badge>}
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setYear(y => Math.max(2026, y - 1))} disabled={year <= 2026}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="rounded-md bg-transparent px-3 py-1.5 text-sm font-semibold text-foreground border-0 focus:outline-none cursor-pointer">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setYear(y => Math.min(2040, y + 1))} disabled={year >= 2040}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => openNew()} size="sm" className="gap-2" disabled={fiscalCats.length === 0}>
            <Plus className="w-4 h-4" /> Nouvelle écriture
          </Button>
          <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2">
            <FileDown className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      {fiscalCats.length === 0 && (
        <Alert>
          <Tag className="h-4 w-4" />
          <AlertTitle>Aucune activité fiscale</AlertTitle>
          <AlertDescription className="text-sm">
            Ajoutez vos activités (E-commerce, Prestation de service, Consultante data…) dans{' '}
            <Link to="/categories" className="underline font-medium">Catégories → Fiscalité</Link>.
          </AlertDescription>
        </Alert>
      )}

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <Alert key={i} variant={a.type} className="border-l-4">
              {a.type === 'destructive' ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle className="font-semibold">{a.title}</AlertTitle>
              <AlertDescription className="text-sm">{a.msg}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardContent className="p-5 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CA Annuel</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{fmtShort(caAnnuel)}</p>
            <p className="text-xs text-muted-foreground mt-1">{fmt(caAnnuel)}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <CardContent className="p-5 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-amber-500/10"><Calculator className="w-4 h-4 text-amber-600" /></div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Impôt (6%)</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{fmtShort(impotAnnuel)}</p>
            <p className="text-xs text-muted-foreground mt-1">{fmt(impotAnnuel)}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <CardContent className="p-5 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10"><Wallet className="w-4 h-4 text-emerald-600" /></div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Payé</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{fmtShort(totalPaye)}</p>
            <p className="text-xs text-muted-foreground mt-1">{fmt(totalPaye)}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${solde > 0 ? 'from-red-500/5' : 'from-emerald-500/5'} to-transparent`} />
          <CardContent className="p-5 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg ${solde > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                {solde > 0 ? <XCircle className="w-4 h-4 text-red-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Solde</span>
            </div>
            <p className={`text-2xl font-bold ${solde > 0 ? 'text-destructive' : 'text-emerald-600'}`}>{fmtShort(solde)}</p>
            <p className="text-xs text-muted-foreground mt-1">{fmt(solde)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progression */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Progression des paiements</span>
            <span className="text-sm font-bold text-foreground">{progressPaiement.toFixed(0)}%</span>
          </div>
          <Progress value={progressPaiement} className="h-3" />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">Payé: {fmt(totalPaye)}</span>
            <span className="text-xs text-muted-foreground">Total dû: {fmt(impotAnnuel)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Chart + écritures */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Chiffre d'affaires mensuel détaillé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1.5 h-32 mb-4 px-1">
            {MONTHS.map(m => {
              const val = monthTotal(m.key);
              const height = Math.max(4, (val / maxMonthCA) * 100);
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">{val > 0 ? fmtShort(val) : ''}</span>
                  <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden" style={{ height: `${height}%`, minHeight: '4px' }}>
                    {fiscalCats.map((c, i) => {
                      const v = monthCatTotal(m.key, c.name);
                      if (v <= 0) return null;
                      return (
                        <div key={c.id} className={`w-full bg-gradient-to-t ${PALETTE[i % PALETTE.length].grad}`}
                          style={{ height: val > 0 ? `${(v / val) * 100}%` : '0', minHeight: '2px' }} />
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground flex-wrap">
            {fiscalCats.map((c, i) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${PALETTE[i % PALETTE.length].bar}`} /> {c.name}
              </div>
            ))}
          </div>
          <Separator className="mb-4" />

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="all" className="gap-1.5"><Calculator className="w-3.5 h-3.5" /> Toutes activités</TabsTrigger>
              {fiscalCats.map(c => (
                <TabsTrigger key={c.id} value={c.id} className="gap-1.5"><Tag className="w-3.5 h-3.5" /> {c.name}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="all">
              {monthsAccordion()}
              <div className="mt-3 text-right text-sm font-semibold text-foreground">Total {year} : {fmt(caAnnuel)}</div>
            </TabsContent>
            {fiscalCats.map(c => (
              <TabsContent key={c.id} value={c.id}>
                {monthsAccordion(c.name)}
                <div className="mt-3 text-right text-sm font-semibold text-foreground">Total {c.name} : {fmt(catTotal(c.name))}</div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Trimestres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUARTERS.map((q, i) => {
          const reste = Math.max(0, quarterImpot[i] - quarterPaid[i]);
          const paid = quarterImpot[i] > 0 && quarterPaid[i] >= quarterImpot[i];
          const progress = quarterImpot[i] > 0 ? Math.min(100, (quarterPaid[i] / quarterImpot[i]) * 100) : 0;
          const isLocked = !!locks[`locked_t${i + 1}`];
          return (
            <Card key={q.label} className={`relative overflow-hidden border bg-gradient-to-br ${q.color}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{q.label}</span>
                    <span className="text-xs text-muted-foreground">{q.period}</span>
                  </div>
                  <Badge variant={paid ? 'default' : 'secondary'} className={`gap-1 ${paid ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
                    {isLocked ? <Lock className="w-3 h-3" /> : paid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {isLocked ? 'Validé' : paid ? 'Soldé' : 'En cours'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-card/80">
                    <p className="text-xs text-muted-foreground">CA</p>
                    <p className="text-lg font-bold text-foreground">{fmt(quarterCA[i])}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {fiscalCats.map((c, ci) => {
                        const v = q.months.reduce((s, m) => s + monthCatTotal(m, c.name), 0);
                        if (v <= 0) return null;
                        return <span key={c.id} className={`text-[10px] ${PALETTE[ci % PALETTE.length].text}`}>{c.name}: {fmtShort(v)}</span>;
                      })}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-card/80">
                    <p className="text-xs text-muted-foreground">Impôt dû</p>
                    <p className="text-lg font-bold text-foreground">{fmt(quarterImpot[i])}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Montant payé</label>
                  <Input type="number" min={0} value={payments[q.payKey] || ''} placeholder="0"
                    onChange={e => setPayments(prev => ({ ...prev, [q.payKey]: Math.max(0, Number(e.target.value) || 0) }))}
                    onBlur={() => savePayment(q.payKey, payments[q.payKey] || 0)}
                    className="mt-1" disabled={isLocked} />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">Reste à payer</span>
                  <span className={`text-lg font-bold ${reste > 0 ? 'text-destructive' : 'text-emerald-600'}`}>{fmt(reste)}</span>
                </div>

                {!isLocked && quarterCA[i] > 0 && (
                  <Button variant={paid ? 'default' : 'outline'} size="sm" className="w-full gap-2 mt-2"
                    onClick={() => {
                      if (window.confirm(`Êtes-vous sûr de vouloir valider le ${q.label} ? Les données ne seront plus modifiables.`)) lockQuarter(i);
                    }}>
                    <Lock className="w-3.5 h-3.5" /> Valider & Verrouiller {q.label}
                  </Button>
                )}
                {isLocked && (
                  <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Trimestre validé — Lecture seule</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Projections */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Projections {year}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/40">
            <p className="text-xs text-muted-foreground">Moyenne mensuelle ({monthsFilled} mois)</p>
            <p className="text-lg font-bold text-foreground">{fmt(moyenne)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/40">
            <p className="text-xs text-muted-foreground">CA projeté (12 mois)</p>
            <p className="text-lg font-bold text-foreground">{fmt(caProjecte)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/40">
            <p className="text-xs text-muted-foreground">Impôt projeté</p>
            <p className="text-lg font-bold text-foreground">{fmt(impotProjecte)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog écriture */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Modifier l\'écriture' : 'Nouvelle écriture fiscale'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Activité</Label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {fiscalCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Mois</Label>
                <Select value={form.month} onValueChange={v => setForm(f => ({ ...f, month: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.key} value={m.key} disabled={isMonthDisabled(m.key)}>{m.full}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Détail de la prestation / vente</Label>
              <Textarea value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Ex: Création site web vitrine, Maintenance mensuelle, Vente lot de produits…"
                className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Montant (XOF)</Label>
                <Input type="number" min={0} value={form.amount} placeholder="150000"
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Date (optionnel)</Label>
                <Input type="date" value={form.entryDate}
                  onChange={e => setForm(f => ({ ...f, entryDate: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Client (optionnel)</Label>
              <Input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                placeholder="Nom du client" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={submitEntry} disabled={saving}>{form.id ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
