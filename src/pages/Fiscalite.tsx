import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle, TrendingUp, Calculator, Landmark, ShieldAlert,
  FileDown, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  BarChart3, Wallet, Receipt, Lock, Unlock, ShoppingCart, Briefcase, Database
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

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

const YEARS = Array.from({ length: 15 }, (_, i) => 2026 + i); // 2026 to 2040

const TAUX = 0.06;
const SEUIL_TVA = 30_000_000;

type FiscalRecord = Record<string, number>;
type LockRecord = Record<string, boolean>;

const ecomKey = (m: string) => `ecom_${m}`;
const serviceKey = (m: string) => `service_${m}`;
const consultKey = (m: string) => `consult_${m}`;
const caKey = (m: string) => `ca_${m}`;

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
};

export default function Fiscalite() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<FiscalRecord>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locks, setLocks] = useState<LockRecord>({});

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from('fiscal_data')
      .select('*')
      .eq('year', year)
      .maybeSingle();

    if (rows) {
      setRecordId(rows.id);
      const rec: FiscalRecord = {};
      MONTHS.forEach(m => {
        rec[ecomKey(m.key)] = Number((rows as any)[ecomKey(m.key)]) || 0;
        rec[serviceKey(m.key)] = Number((rows as any)[serviceKey(m.key)]) || 0;
        rec[consultKey(m.key)] = Number((rows as any)[consultKey(m.key)]) || 0;
        rec[caKey(m.key)] = Number((rows as any)[caKey(m.key)]) || 0;
      });
      QUARTERS.forEach(q => (rec[q.payKey] = Number((rows as any)[q.payKey]) || 0));
      setData(rec);
      const lk: LockRecord = {};
      QUARTERS.forEach((q, i) => { lk[`locked_t${i+1}`] = !!(rows as any)[`locked_t${i+1}`]; });
      setLocks(lk);
    } else {
      setRecordId(null);
      const rec: FiscalRecord = {};
      MONTHS.forEach(m => {
        rec[ecomKey(m.key)] = 0;
        rec[serviceKey(m.key)] = 0;
        rec[consultKey(m.key)] = 0;
        rec[caKey(m.key)] = 0;
      });
      QUARTERS.forEach(q => (rec[q.payKey] = 0));
      setData(rec);
      setLocks({});
    }
    setLoading(false);
  }, [userId, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveField = useCallback(async (key: string, value: number) => {
    if (!userId) return;
    setSaving(true);
    const updates: any = { [key]: value, updated_at: new Date().toISOString() };

    if (recordId) {
      await supabase.from('fiscal_data').update(updates as any).eq('id', recordId);
    } else {
      const insert: any = { user_id: userId, year, [key]: value };
      const { data: row } = await supabase.from('fiscal_data').insert(insert).select().single();
      if (row) setRecordId(row.id);
    }
    setSaving(false);
    toast({ title: '✓ Enregistré', description: `Donnée mise à jour` });
  }, [userId, recordId, year, toast]);

  const lockQuarter = useCallback(async (quarterIndex: number) => {
    if (!userId || !recordId) return;
    const lockKey = `locked_t${quarterIndex + 1}`;
    await supabase.from('fiscal_data').update({ [lockKey]: true, updated_at: new Date().toISOString() } as any).eq('id', recordId);
    setLocks(prev => ({ ...prev, [lockKey]: true }));
    toast({ title: '🔒 Trimestre validé', description: `Le ${QUARTERS[quarterIndex].label} est maintenant verrouillé.` });
  }, [userId, recordId, toast]);

  const isMonthLocked = (monthKey: string): boolean => {
    for (let i = 0; i < QUARTERS.length; i++) {
      if ((QUARTERS[i].months as readonly string[]).includes(monthKey)) {
        return !!locks[`locked_t${i + 1}`];
      }
    }
    return false;
  };

  const handleChange = (key: string, raw: string, monthKey?: string) => {
    const val = Math.max(0, Number(raw) || 0);
    setData(prev => {
      const next = { ...prev, [key]: val };
      if (monthKey) {
        const eVal = key === ecomKey(monthKey) ? val : (prev[ecomKey(monthKey)] || 0);
        const sVal = key === serviceKey(monthKey) ? val : (prev[serviceKey(monthKey)] || 0);
        const cVal = key === consultKey(monthKey) ? val : (prev[consultKey(monthKey)] || 0);
        next[caKey(monthKey)] = eVal + sVal + cVal;
      }
      return next;
    });
  };

  const saveFieldWithCA = useCallback(async (key: string, value: number, monthKey: string) => {
    if (!userId) return;
    setSaving(true);
    const eVal = key === ecomKey(monthKey) ? value : (data[ecomKey(monthKey)] || 0);
    const sVal = key === serviceKey(monthKey) ? value : (data[serviceKey(monthKey)] || 0);
    const cVal = key === consultKey(monthKey) ? value : (data[consultKey(monthKey)] || 0);
    const caVal = eVal + sVal + cVal;
    const updates: any = {
      [key]: value,
      [caKey(monthKey)]: caVal,
      updated_at: new Date().toISOString(),
    };

    if (recordId) {
      await supabase.from('fiscal_data').update(updates as any).eq('id', recordId);
    } else {
      const insert: any = { user_id: userId, year, ...updates };
      const { data: row } = await supabase.from('fiscal_data').insert(insert).select().single();
      if (row) setRecordId(row.id);
    }
    setData(prev => ({ ...prev, [caKey(monthKey)]: caVal }));
    setSaving(false);
    toast({ title: '✓ Enregistré', description: `Donnée mise à jour` });
  }, [userId, recordId, year, toast, data]);

  // ---- Calculs ----
  const quarterCA = QUARTERS.map(q => q.months.reduce((s, m) => s + (data[caKey(m)] || 0), 0));
  const quarterEcom = QUARTERS.map(q => q.months.reduce((s, m) => s + (data[ecomKey(m)] || 0), 0));
  const quarterService = QUARTERS.map(q => q.months.reduce((s, m) => s + (data[serviceKey(m)] || 0), 0));
  const quarterConsult = QUARTERS.map(q => q.months.reduce((s, m) => s + (data[consultKey(m)] || 0), 0));
  const quarterImpot = quarterCA.map(ca => ca * TAUX);
  const quarterPaid = QUARTERS.map(q => data[q.payKey] || 0);

  const caAnnuel = quarterCA.reduce((a, b) => a + b, 0);
  const ecomAnnuel = quarterEcom.reduce((a, b) => a + b, 0);
  const serviceAnnuel = quarterService.reduce((a, b) => a + b, 0);
  const consultAnnuel = quarterConsult.reduce((a, b) => a + b, 0);
  const impotAnnuel = caAnnuel * TAUX;
  const totalPaye = quarterPaid.reduce((a, b) => a + b, 0);
  const solde = impotAnnuel - totalPaye;
  const progressPaiement = impotAnnuel > 0 ? Math.min(100, (totalPaye / impotAnnuel) * 100) : 0;

  const monthsFilled = MONTHS.filter(m => (data[caKey(m.key)] || 0) > 0).length;
  const moyenne = monthsFilled > 0 ? caAnnuel / monthsFilled : 0;
  const caProjecte = moyenne * 12;
  const impotProjecte = caProjecte * TAUX;

  // Max month CA for chart
  const maxMonthCA = Math.max(...MONTHS.map(m => data[caKey(m.key)] || 0), 1);

  // ---- Alertes ----
  const alerts: { type: 'destructive' | 'default'; title: string; msg: string }[] = [];
  if (caAnnuel >= SEUIL_TVA) {
    alerts.push({ type: 'destructive', title: 'Risque TVA (18%)', msg: `Votre CA annuel (${fmt(caAnnuel)}) dépasse le seuil de ${fmt(SEUIL_TVA)}.` });
  }
  QUARTERS.forEach((q, i) => {
    if (i > 0 && quarterCA[i - 1] > 0 && quarterCA[i] > quarterCA[i - 1] * 1.5) {
      alerts.push({ type: 'default', title: `Forte croissance ${q.label}`, msg: `Le CA ${q.label} a augmenté de +50% vs trimestre précédent.` });
    }
    if (quarterImpot[i] > 0 && quarterPaid[i] < quarterImpot[i]) {
      alerts.push({ type: 'default', title: `Impôt ${q.label} non soldé`, msg: `Dû: ${fmt(quarterImpot[i])} — Payé: ${fmt(quarterPaid[i])}` });
    }
  });

  // ---- Export PDF ----
  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Fiscalité ${year} — FinTrack</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; padding: 40px; background: #fff; }
  .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
  .header h1 { font-size: 28px; color: #1a1a2e; margin-bottom: 4px; }
  .header p { color: #64748b; font-size: 14px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
  .summary-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary-card .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
  .summary-card .value.danger { color: #ef4444; }
  .summary-card .value.success { color: #22c55e; }
  .section { margin-bottom: 28px; }
  .section h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #1e293b; border-left: 4px solid #3b82f6; padding-left: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) { background: #fafbfc; }
  .text-right { text-align: right; }
  .bold { font-weight: 700; }
  .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  .alert { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; font-size: 13px; color: #991b1b; }
  .alert.warning { background: #fffbeb; border-color: #fde68a; color: #92400e; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="header">
  <h1>📊 Récapitulatif Fiscal ${year}</h1>
  <p>Régime Simplifié — Bamako — Taux 6% | Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
</div>

<div class="summary-grid">
  <div class="summary-card"><div class="label">CA Annuel</div><div class="value">${fmt(caAnnuel)}</div></div>
  <div class="summary-card"><div class="label">Impôt Annuel</div><div class="value">${fmt(impotAnnuel)}</div></div>
  <div class="summary-card"><div class="label">Total Payé</div><div class="value success">${fmt(totalPaye)}</div></div>
  <div class="summary-card"><div class="label">Solde Restant</div><div class="value ${solde > 0 ? 'danger' : 'success'}">${fmt(solde)}</div></div>
</div>

${alerts.length > 0 ? `<div class="section"><h2>⚠️ Alertes</h2>${alerts.map(a => `<div class="alert ${a.type === 'default' ? 'warning' : ''}">${a.title}: ${a.msg}</div>`).join('')}</div>` : ''}

<div class="section">
  <h2>Chiffre d'affaires mensuel</h2>
  <table>
    <tr><th>Mois</th><th class="text-right">E-commerce</th><th class="text-right">Services</th><th class="text-right">CA Total</th><th class="text-right">Impôt (6%)</th></tr>
    ${MONTHS.map(m => `<tr><td>${m.full}</td><td class="text-right">${fmt(data[ecomKey(m.key)] || 0)}</td><td class="text-right">${fmt(data[serviceKey(m.key)] || 0)}</td><td class="text-right bold">${fmt(data[caKey(m.key)] || 0)}</td><td class="text-right">${fmt((data[caKey(m.key)] || 0) * TAUX)}</td></tr>`).join('')}
    <tr class="bold" style="background:#e8f0fe"><td>Total</td><td class="text-right">${fmt(ecomAnnuel)}</td><td class="text-right">${fmt(serviceAnnuel)}</td><td class="text-right">${fmt(caAnnuel)}</td><td class="text-right">${fmt(impotAnnuel)}</td></tr>
  </table>
</div>

<div class="section">
  <h2>Détail trimestriel</h2>
  <table>
    <tr><th>Trimestre</th><th class="text-right">CA</th><th class="text-right">Impôt dû</th><th class="text-right">Payé</th><th class="text-right">Reste</th></tr>
    <tr><th>Trimestre</th><th class="text-right">E-commerce</th><th class="text-right">Services</th><th class="text-right">CA Total</th><th class="text-right">Impôt dû</th><th class="text-right">Payé</th><th class="text-right">Reste</th></tr>
    ${QUARTERS.map((q, i) => `<tr><td>${q.label} (${q.period})</td><td class="text-right">${fmt(quarterEcom[i])}</td><td class="text-right">${fmt(quarterService[i])}</td><td class="text-right bold">${fmt(quarterCA[i])}</td><td class="text-right">${fmt(quarterImpot[i])}</td><td class="text-right">${fmt(quarterPaid[i])}</td><td class="text-right bold ${quarterImpot[i] - quarterPaid[i] > 0 ? 'style="color:#ef4444"' : ''}">${fmt(Math.max(0, quarterImpot[i] - quarterPaid[i]))}</td></tr>`).join('')}
  </table>
</div>

<div class="section">
  <h2>Projections</h2>
  <table>
    <tr><td>Moyenne mensuelle (${monthsFilled} mois)</td><td class="text-right bold">${fmt(moyenne)}</td></tr>
    <tr><td>CA projeté (12 mois)</td><td class="text-right bold">${fmt(caProjecte)}</td></tr>
    <tr><td>Impôt projeté</td><td class="text-right bold">${fmt(impotProjecte)}</td></tr>
  </table>
</div>

<div class="footer">FinTrack — Document généré automatiquement. Ne constitue pas un document fiscal officiel.</div>
</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Fiscalité</h1>
              <p className="text-sm text-muted-foreground">Régime simplifié — Bamako — Taux 6%</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saving && <Badge variant="secondary" className="animate-pulse">Sauvegarde...</Badge>}
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setYear(y => Math.max(2026, y - 1))}
              disabled={year <= 2026}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="rounded-md bg-transparent px-3 py-1.5 text-sm font-semibold text-foreground border-0 focus:outline-none cursor-pointer"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setYear(y => Math.min(2040, y + 1))}
              disabled={year >= 2040}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2">
            <FileDown className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardContent className="p-5 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
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
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Calculator className="w-4 h-4 text-amber-600" />
              </div>
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
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
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

      {/* Progression globale */}
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

      {/* Mini chart CA mensuel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Chiffre d'affaires mensuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Visual bars */}
          <div className="flex items-end gap-1.5 h-32 mb-4 px-1">
            {MONTHS.map(m => {
              const eVal = data[ecomKey(m.key)] || 0;
              const sVal = data[serviceKey(m.key)] || 0;
              const val = eVal + sVal;
              const height = maxMonthCA > 0 ? Math.max(4, (val / maxMonthCA) * 100) : 4;
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {val > 0 ? fmtShort(val) : ''}
                  </span>
                  <div
                    className="w-full flex flex-col-reverse rounded-t-md overflow-hidden"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  >
                    {eVal > 0 && (
                      <div
                        className="w-full bg-gradient-to-t from-primary to-primary/60"
                        style={{ height: val > 0 ? `${(eVal / val) * 100}%` : '0', minHeight: '2px' }}
                      />
                    )}
                    {sVal > 0 && (
                      <div
                        className="w-full bg-gradient-to-t from-amber-500 to-amber-400/60"
                        style={{ height: val > 0 ? `${(sVal / val) * 100}%` : '0', minHeight: '2px' }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-primary" /> E-commerce</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-500" /> Services</div>
          </div>
          <Separator className="mb-4" />
          {/* Input grid */}
          <Tabs defaultValue="ecom" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="ecom" className="gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5" /> E-commerce
              </TabsTrigger>
              <TabsTrigger value="service" className="gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Prestation de service
              </TabsTrigger>
              <TabsTrigger value="total" className="gap-1.5">
                <Calculator className="w-3.5 h-3.5" /> Total combiné
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ecom">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {MONTHS.map(m => (
                  <div key={m.key}>
                    <label className="text-xs font-medium text-muted-foreground">{m.full}</label>
                    <Input
                      type="number"
                      min={0}
                      value={data[ecomKey(m.key)] || ''}
                      placeholder="0"
                      onChange={e => handleChange(ecomKey(m.key), e.target.value, m.key)}
                      onBlur={() => saveFieldWithCA(ecomKey(m.key), data[ecomKey(m.key)] || 0, m.key)}
                      className="mt-1 text-sm"
                      disabled={isMonthLocked(m.key)}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right text-sm font-semibold text-foreground">
                Total E-commerce : {fmt(ecomAnnuel)}
              </div>
            </TabsContent>
            <TabsContent value="service">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {MONTHS.map(m => (
                  <div key={m.key}>
                    <label className="text-xs font-medium text-muted-foreground">{m.full}</label>
                    <Input
                      type="number"
                      min={0}
                      value={data[serviceKey(m.key)] || ''}
                      placeholder="0"
                      onChange={e => handleChange(serviceKey(m.key), e.target.value, m.key)}
                      onBlur={() => saveFieldWithCA(serviceKey(m.key), data[serviceKey(m.key)] || 0, m.key)}
                      className="mt-1 text-sm"
                      disabled={isMonthLocked(m.key)}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 text-right text-sm font-semibold text-foreground">
                Total Services : {fmt(serviceAnnuel)}
              </div>
            </TabsContent>
            <TabsContent value="total">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {MONTHS.map(m => {
                  const total = (data[ecomKey(m.key)] || 0) + (data[serviceKey(m.key)] || 0);
                  return (
                    <div key={m.key}>
                      <label className="text-xs font-medium text-muted-foreground">{m.full}</label>
                      <div className="mt-1 text-sm p-2 rounded-md bg-muted/50 border border-border font-semibold text-foreground">
                        {fmt(total)}
                      </div>
                      <div className="flex gap-1 mt-0.5">
                        <span className="text-[10px] text-primary">{fmtShort(data[ecomKey(m.key)] || 0)}</span>
                        <span className="text-[10px] text-muted-foreground">+</span>
                        <span className="text-[10px] text-amber-600">{fmtShort(data[serviceKey(m.key)] || 0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-right text-sm font-semibold text-foreground">
                Total combiné : {fmt(caAnnuel)}
              </div>
            </TabsContent>
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
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] text-primary">E-com: {fmtShort(quarterEcom[i])}</span>
                      <span className="text-[10px] text-amber-600">Serv: {fmtShort(quarterService[i])}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-card/80">
                    <p className="text-xs text-muted-foreground">Impôt dû</p>
                    <p className="text-lg font-bold text-foreground">{fmt(quarterImpot[i])}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Montant payé</label>
                  <Input
                    type="number"
                    min={0}
                    value={data[q.payKey] || ''}
                    placeholder="0"
                    onChange={e => handleChange(q.payKey, e.target.value)}
                    onBlur={() => saveField(q.payKey, data[q.payKey] || 0)}
                    className="mt-1"
                    disabled={isLocked}
                  />
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
                  <span className={`text-lg font-bold ${reste > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    {fmt(reste)}
                  </span>
                </div>

                {!isLocked && quarterCA[i] > 0 && (
                  <Button
                    variant={paid ? 'default' : 'outline'}
                    size="sm"
                    className="w-full gap-2 mt-2"
                    onClick={() => {
                      if (window.confirm(`Êtes-vous sûr de vouloir valider le ${q.label} ? Les données ne seront plus modifiables.`)) {
                        lockQuarter(i);
                      }
                    }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Valider & Verrouiller {q.label}
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
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Projections annuelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Moyenne mensuelle</p>
              <p className="text-2xl font-bold text-foreground mt-2">{fmt(moyenne)}</p>
              <p className="text-xs text-muted-foreground mt-1">sur {monthsFilled} mois renseignés</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CA projeté (12 mois)</p>
              <p className="text-2xl font-bold text-foreground mt-2">{fmt(caProjecte)}</p>
              {caProjecte >= SEUIL_TVA && (
                <p className="text-xs text-destructive mt-1 font-medium">⚠ Dépasse le seuil TVA</p>
              )}
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Impôt projeté</p>
              <p className="text-2xl font-bold text-foreground mt-2">{fmt(impotProjecte)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
