import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Calculator, Landmark, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MONTHS = [
  { key: 'ca_jan', label: 'Janvier' },
  { key: 'ca_fev', label: 'Février' },
  { key: 'ca_mar', label: 'Mars' },
  { key: 'ca_avr', label: 'Avril' },
  { key: 'ca_mai', label: 'Mai' },
  { key: 'ca_juin', label: 'Juin' },
  { key: 'ca_juil', label: 'Juillet' },
  { key: 'ca_aout', label: 'Août' },
  { key: 'ca_sept', label: 'Septembre' },
  { key: 'ca_oct', label: 'Octobre' },
  { key: 'ca_nov', label: 'Novembre' },
  { key: 'ca_dec', label: 'Décembre' },
] as const;

const QUARTERS = [
  { label: 'T1', months: ['ca_jan', 'ca_fev', 'ca_mar'], payKey: 'paiement_t1' },
  { label: 'T2', months: ['ca_avr', 'ca_mai', 'ca_juin'], payKey: 'paiement_t2' },
  { label: 'T3', months: ['ca_juil', 'ca_aout', 'ca_sept'], payKey: 'paiement_t3' },
  { label: 'T4', months: ['ca_oct', 'ca_nov', 'ca_dec'], payKey: 'paiement_t4' },
] as const;

const TAUX = 0.06;
const SEUIL_TVA = 30_000_000;

type FiscalRecord = Record<string, number>;

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);

export default function Fiscalite() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<FiscalRecord>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      MONTHS.forEach(m => (rec[m.key] = Number((rows as any)[m.key]) || 0));
      QUARTERS.forEach(q => (rec[q.payKey] = Number((rows as any)[q.payKey]) || 0));
      setData(rec);
    } else {
      setRecordId(null);
      const rec: FiscalRecord = {};
      MONTHS.forEach(m => (rec[m.key] = 0));
      QUARTERS.forEach(q => (rec[q.payKey] = 0));
      setData(rec);
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
    toast({ title: 'Enregistré', description: `${key} mis à jour` });
  }, [userId, recordId, year, toast]);

  const handleChange = (key: string, raw: string) => {
    const val = Math.max(0, Number(raw) || 0);
    setData(prev => ({ ...prev, [key]: val }));
  };

  // ---- Calculs ----
  const quarterCA = QUARTERS.map(q => q.months.reduce((s, m) => s + (data[m] || 0), 0));
  const quarterImpot = quarterCA.map(ca => ca * TAUX);
  const quarterPaid = QUARTERS.map(q => data[q.payKey] || 0);

  const caAnnuel = quarterCA.reduce((a, b) => a + b, 0);
  const impotAnnuel = caAnnuel * TAUX;
  const totalPaye = quarterPaid.reduce((a, b) => a + b, 0);
  const solde = impotAnnuel - totalPaye;

  const monthsFilled = MONTHS.filter(m => (data[m.key] || 0) > 0).length;
  const moyenne = monthsFilled > 0 ? caAnnuel / monthsFilled : 0;
  const caProjecte = moyenne * 12;
  const impotProjecte = caProjecte * TAUX;

  // ---- Alertes ----
  const alerts: { type: 'destructive' | 'default'; title: string; msg: string }[] = [];
  if (caAnnuel >= SEUIL_TVA) {
    alerts.push({ type: 'destructive', title: 'Risque TVA (18%)', msg: `Votre CA annuel (${fmt(caAnnuel)}) dépasse le seuil de ${fmt(SEUIL_TVA)}. Vous pourriez être assujetti à la TVA à 18%.` });
  }
  QUARTERS.forEach((q, i) => {
    if (i > 0 && quarterCA[i - 1] > 0 && quarterCA[i] > quarterCA[i - 1] * 1.5) {
      alerts.push({ type: 'default', title: `Forte croissance ${q.label}`, msg: `Le CA ${q.label} a augmenté de plus de 50% par rapport au trimestre précédent. À vérifier.` });
    }
    if (quarterImpot[i] > 0 && quarterPaid[i] < quarterImpot[i]) {
      alerts.push({ type: 'default', title: `Impôt ${q.label} non couvert`, msg: `Impôt dû: ${fmt(quarterImpot[i])} — Payé: ${fmt(quarterPaid[i])}.` });
    }
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fiscalité</h1>
          <p className="text-sm text-muted-foreground">Régime simplifié — Bamako — Taux 6%</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Année :</span>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {saving && <Badge variant="secondary" className="animate-pulse">Enregistrement...</Badge>}
        </div>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <Alert key={i} variant={a.type}>
              {a.type === 'destructive' ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>{a.title}</AlertTitle>
              <AlertDescription>{a.msg}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Résumé annuel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'CA Annuel', value: caAnnuel, icon: TrendingUp },
          { label: 'Impôt Annuel (6%)', value: impotAnnuel, icon: Calculator },
          { label: 'Total Payé', value: totalPaye, icon: Landmark },
          { label: 'Solde Restant', value: solde, icon: ShieldAlert },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </div>
              <p className={`text-lg font-bold ${item.label === 'Solde Restant' && item.value > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {fmt(item.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CA mensuel */}
      <Card>
        <CardHeader><CardTitle className="text-base">Chiffre d'affaires mensuel</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {MONTHS.map(m => (
              <div key={m.key}>
                <label className="text-xs text-muted-foreground">{m.label}</label>
                <Input
                  type="number"
                  min={0}
                  value={data[m.key] || ''}
                  placeholder="0"
                  onChange={e => handleChange(m.key, e.target.value)}
                  onBlur={() => saveField(m.key, data[m.key] || 0)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trimestres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUARTERS.map((q, i) => (
          <Card key={q.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{q.label} — {['Jan–Mar', 'Avr–Juin', 'Juil–Sep', 'Oct–Déc'][i]}</span>
                <Badge variant={quarterPaid[i] >= quarterImpot[i] && quarterImpot[i] > 0 ? 'default' : 'secondary'}>
                  {quarterPaid[i] >= quarterImpot[i] && quarterImpot[i] > 0 ? 'Payé' : 'En attente'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CA {q.label}</span>
                <span className="font-medium text-foreground">{fmt(quarterCA[i])}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Impôt dû (6%)</span>
                <span className="font-medium text-foreground">{fmt(quarterImpot[i])}</span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Montant payé</label>
                <Input
                  type="number"
                  min={0}
                  value={data[q.payKey] || ''}
                  placeholder="0"
                  onChange={e => handleChange(q.payKey, e.target.value)}
                  onBlur={() => saveField(q.payKey, data[q.payKey] || 0)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">Reste à payer</span>
                <span className={`font-bold ${quarterImpot[i] - quarterPaid[i] > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {fmt(Math.max(0, quarterImpot[i] - quarterPaid[i]))}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projections */}
      <Card>
        <CardHeader><CardTitle className="text-base">📈 Projections annuelles</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Moyenne mensuelle</p>
              <p className="text-lg font-bold text-foreground">{fmt(moyenne)}</p>
              <p className="text-xs text-muted-foreground">sur {monthsFilled} mois renseignés</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">CA projeté (12 mois)</p>
              <p className="text-lg font-bold text-foreground">{fmt(caProjecte)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Impôt projeté</p>
              <p className="text-lg font-bold text-foreground">{fmt(impotProjecte)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
