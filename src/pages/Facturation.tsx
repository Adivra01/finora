import { mask } from '@/lib/privacy';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Pencil,
  Settings2,
  BellRing,
  Copy,
  Wallet,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import {
  DEFAULT_INVOICE_SETTINGS,
  InvoiceSettings,
  PAYMENT_PRESETS,
  loadInvoiceSettings,
  saveInvoiceSettings,
} from '@/lib/invoiceSettings';
import { buildInvoiceHTML } from '@/lib/invoiceTemplate';
import InvoicePreview from '@/components/InvoicePreview';

type Invoice = {
  id: string;
  invoice_number: string;
  type: string;
  client_name: string;
  client_email: string;
  client_address: string;
  issue_date: string;
  due_date: string | null;
  status: string;
  notes: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  created_at: string;
  sender_override?: Partial<InvoiceSettings> | null;
};

type InvoicePayment = {
  id: string;
  invoice_id: string;
  amount: number;
  date: string;
  note: string;
  transaction_id: string | null;
};

type InvoiceItem = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon', color: 'bg-muted text-muted-foreground' },
  'envoyé': { label: 'Envoyé', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  partiel: { label: 'Partiel', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  'payé': { label: 'Payé', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  'annulé': { label: 'Annulé', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

const fmt = (n: number) => mask(_fmt(n));
const _fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(n) + ' XOF';

export default function Facturation() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const { refresh: refreshData } = useData();
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);
  const [viewItems, setViewItems] = useState<InvoiceItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'facture' | 'devis'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);

  useEffect(() => {
    setSettings(loadInvoiceSettings());
  }, []);

  // Form state
  const [form, setForm] = useState({
    type: 'facture',
    invoice_number: '',
    client_name: '',
    client_email: '',
    client_address: '',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    notes: '',
    tax_rate: 0,
  });
  const [sender, setSender] = useState<Partial<InvoiceSettings>>({});

  /** settings merged with the per-invoice sender override */
  const effSettings = (inv?: Invoice | null): InvoiceSettings => ({
    ...settings,
    ...((inv?.sender_override as Partial<InvoiceSettings>) || {}),
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);

  const fetchInvoices = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) setInvoices(data as Invoice[]);
    const { data: pays } = await supabase.from('invoice_payments').select('*').order('date', { ascending: true });
    setPayments((pays || []).map((p) => ({ ...p, amount: Number(p.amount) })) as InvoicePayment[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, [userId]);

  const generateNumber = (type: string) => {
    const prefix = type === 'facture' ? 'FAC' : 'DEV';
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const count = invoices.filter((i) => i.type === type).length + 1;
    return `${prefix}-${y}${m}-${String(count).padStart(4, '0')}`;
  };

  const updateItemTotal = (index: number, field: string, value: string) => {
    const updated = [...items];
    const item = { ...updated[index] };
    if (field === 'description') item.description = value;
    else if (field === 'quantity') item.quantity = parseFloat(value) || 0;
    else if (field === 'unit_price') item.unit_price = parseFloat(value) || 0;
    item.total = item.quantity * item.unit_price;
    updated[index] = item;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = subtotal * (form.tax_rate / 100);
  const total = subtotal + taxAmount;

  const resetForm = () => {
    setForm({
      type: 'facture',
      invoice_number: '',
      client_name: '',
      client_email: '',
      client_address: '',
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: '',
      notes: '',
      tax_rate: 0,
    });
    setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
    setEditingInvoice(null);
    setSender({});
  };

  const openNew = (type: string) => {
    resetForm();
    setForm((f) => ({ ...f, type, invoice_number: generateNumber(type) }));
    setDialogOpen(true);
  };

  const openEdit = async (inv: Invoice) => {
    setEditingInvoice(inv);
    setSender((inv.sender_override as Partial<InvoiceSettings>) || {});
    setForm({
      type: inv.type,
      invoice_number: inv.invoice_number,
      client_name: inv.client_name,
      client_email: inv.client_email || '',
      client_address: inv.client_address || '',
      issue_date: inv.issue_date,
      due_date: inv.due_date || '',
      notes: inv.notes || '',
      tax_rate: Number(inv.tax_rate),
    });
    // fetch items
    const { data } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', inv.id);
    if (data && data.length > 0) {
      setItems(
        data.map((d) => ({
          id: d.id,
          description: d.description,
          quantity: Number(d.quantity),
          unit_price: Number(d.unit_price),
          total: Number(d.total),
        }))
      );
    } else {
      setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
    }
    setDialogOpen(true);
  };

  const saveInvoice = async () => {
    if (!userId) return;
    if (!form.client_name.trim()) {
      toast({ title: 'Erreur', description: 'Le nom du client est requis', variant: 'destructive' });
      return;
    }
    if (items.every((i) => !i.description.trim())) {
      toast({ title: 'Erreur', description: 'Au moins une ligne est requise', variant: 'destructive' });
      return;
    }

    const invoiceData = {
      user_id: userId,
      invoice_number: form.invoice_number.trim() || generateNumber(form.type),
      type: form.type,
      client_name: form.client_name.trim(),
      client_email: form.client_email.trim(),
      client_address: form.client_address.trim(),
      issue_date: form.issue_date,
      due_date: form.due_date || null,
      notes: form.notes.trim(),
      subtotal,
      tax_rate: form.tax_rate,
      tax_amount: taxAmount,
      total,
      status: editingInvoice ? editingInvoice.status : 'brouillon',
      sender_override: Object.keys(sender).length > 0 ? sender : null,
    };

    let invoiceId = editingInvoice?.id;

    if (editingInvoice) {
      const { error } = await supabase.from('invoices').update(invoiceData).eq('id', editingInvoice.id);
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        return;
      }
      // delete old items
      await supabase.from('invoice_items').delete().eq('invoice_id', editingInvoice.id);
    } else {
      const { data, error } = await supabase.from('invoices').insert(invoiceData).select('id').single();
      if (error || !data) {
        toast({ title: 'Erreur', description: error?.message || 'Erreur inconnue', variant: 'destructive' });
        return;
      }
      invoiceId = data.id;
    }

    // Insert items
    const itemsToInsert = items
      .filter((i) => i.description.trim())
      .map((i) => ({
        invoice_id: invoiceId!,
        description: i.description.trim(),
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.total,
      }));

    if (itemsToInsert.length > 0) {
      await supabase.from('invoice_items').insert(itemsToInsert);
    }

    toast({ title: 'Succès', description: editingInvoice ? 'Document modifié' : 'Document créé' });
    setDialogOpen(false);
    resetForm();
    fetchInvoices();
  };

  const updateStatus = async (inv: Invoice, status: string) => {
    await supabase.from('invoices').update({ status }).eq('id', inv.id);
    fetchInvoices();
    toast({ title: 'Statut mis à jour' });
  };

  const paymentsOf = (inv: Invoice) => payments.filter((p) => p.invoice_id === inv.id);
  const paidOf = (inv: Invoice) => {
    const list = paymentsOf(inv);
    if (list.length === 0 && inv.status === 'payé') return Number(inv.total);
    return list.reduce((s, p) => s + p.amount, 0);
  };
  const remainingOf = (inv: Invoice) => Math.max(0, Number(inv.total) - paidOf(inv));

  const syncStatus = async (inv: Invoice, paid: number) => {
    const status = paid >= Number(inv.total) ? 'payé' : paid > 0 ? 'partiel' : 'envoyé';
    if (status !== inv.status) await supabase.from('invoices').update({ status }).eq('id', inv.id);
    return status;
  };

  const openPayment = (inv: Invoice) => {
    setPayForm({ amount: String(remainingOf(inv)), date: new Date().toISOString().slice(0, 10), note: '' });
    setPayInvoice(inv);
  };

  const addInvoicePayment = async () => {
    if (!payInvoice || !userId) return;
    const amount = Number(payForm.amount);
    const remaining = remainingOf(payInvoice);
    if (!amount || amount <= 0) return toast({ title: 'Montant invalide', variant: 'destructive' });
    if (amount > remaining) return toast({ title: 'Montant supérieur au reliquat', description: `Reste à payer : ${fmt(remaining)}`, variant: 'destructive' });
    const { data: tx } = await supabase.from('transactions').insert({
      user_id: userId, type: 'revenu', category: 'Paiement client', amount, date: payForm.date,
      description: `Paiement de ${payInvoice.client_name} — Facture ${payInvoice.invoice_number}${payForm.note ? ` (${payForm.note})` : ''}`,
    }).select().single();
    const { data, error } = await supabase.from('invoice_payments').insert({
      invoice_id: payInvoice.id, user_id: userId, amount, date: payForm.date, note: payForm.note, transaction_id: tx?.id ?? null,
    }).select().single();
    if (error || !data) return toast({ title: 'Erreur', description: error?.message, variant: 'destructive' });
    const newPaid = paymentsOf(payInvoice).reduce((s, p) => s + p.amount, 0) + amount;
    const status = await syncStatus(payInvoice, newPaid);
    setPayInvoice({ ...payInvoice, status });
    toast({ title: 'Tranche enregistrée', description: `Reliquat : ${fmt(Math.max(0, Number(payInvoice.total) - newPaid))}` });
    setPayForm((f) => ({ ...f, amount: String(Math.max(0, Number(payInvoice.total) - newPaid)), note: '' }));
    await fetchInvoices();
    refreshData();
  };

  const deleteInvoicePayment = async (inv: Invoice, pay: InvoicePayment) => {
    await supabase.from('invoice_payments').delete().eq('id', pay.id);
    if (pay.transaction_id) await supabase.from('transactions').delete().eq('id', pay.transaction_id);
    const newPaid = paymentsOf(inv).filter((p) => p.id !== pay.id).reduce((s, p) => s + p.amount, 0);
    const status = await syncStatus(inv, newPaid);
    setPayInvoice({ ...inv, status });
    await fetchInvoices();
    refreshData();
    toast({ title: 'Tranche supprimée' });
  };

  const deleteInvoice = async (id: string) => {
    await supabase.from('invoices').delete().eq('id', id);
    fetchInvoices();
    toast({ title: 'Document supprimé' });
  };

  const viewInvoice = async (inv: Invoice) => {
    setViewingInvoice(inv);
    const { data } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id);
    setViewItems(
      (data || []).map((d) => ({
        description: d.description,
        quantity: Number(d.quantity),
        unit_price: Number(d.unit_price),
        total: Number(d.total),
      }))
    );
    setViewDialogOpen(true);
  };

  const exportPDF = (inv: Invoice, invItems: InvoiceItem[]) => {
    const html = buildInvoiceHTML({ ...inv, paid_amount: paidOf(inv) }, invItems, effSettings(inv));
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const w = window.open(url, '_blank');
    if (w) {
      w.addEventListener('load', () => {
        w.addEventListener('invoice-ready', () => w.print(), { once: true });
      }, { once: true });
    }
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  };

  const filtered = invoices.filter((inv) => {
    if (filterType !== 'all' && inv.type !== filterType) return false;
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    totalFactures: invoices.filter((i) => i.type === 'facture').length,
    totalDevis: invoices.filter((i) => i.type === 'devis').length,
    enAttente: invoices.filter((i) => i.status === 'envoyé' || i.status === 'partiel').reduce((s, i) => s + remainingOf(i), 0),
    totalPaye: invoices.filter((i) => i.type === 'facture' && i.status !== 'annulé').reduce((s, i) => s + paidOf(i), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facturation & Devis</h1>
          <p className="text-sm text-muted-foreground">Créez et gérez vos factures et devis professionnels</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSettingsOpen(true)} variant="outline" className="gap-2">
            <Settings2 className="w-4 h-4" /> Modèle facture
          </Button>
          <Button onClick={() => openNew('devis')} variant="outline" className="gap-2">
            <FileText className="w-4 h-4" /> Nouveau devis
          </Button>
          <Button onClick={() => openNew('facture')} className="gap-2">
            <Plus className="w-4 h-4" /> Nouvelle facture
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Factures</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalFactures}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Devis</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalDevis}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Reste à encaisser</p>
            <p className="text-2xl font-bold text-amber-600">{fmt(stats.enAttente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total payé</p>
            <p className="text-2xl font-bold text-green-600">{fmt(stats.totalPaye)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'facture', 'devis'] as const).map((t) => (
          <Button
            key={t}
            variant={filterType === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType(t)}
          >
            {t === 'all' ? 'Tout' : t === 'facture' ? 'Factures' : 'Devis'}
          </Button>
        ))}
        <span className="w-px bg-border mx-1" />
        {(['all', 'brouillon', 'envoyé', 'partiel', 'payé', 'annulé'] as const).map((s) => (
          <Button
            key={s}
            variant={filterStatus === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(s)}
          >
            {s === 'all' ? 'Tous statuts' : STATUS_LABELS[s]?.label || s}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun document trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Payé / Reliquat</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => {
                  const st = STATUS_LABELS[inv.status] || { label: inv.status, color: 'bg-muted' };
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold uppercase ${inv.type === 'facture' ? 'text-primary' : 'text-amber-600'}`}>
                          {inv.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{inv.client_name}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.issue_date}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(Number(inv.total))}</TableCell>
                      <TableCell className="text-right text-sm">
                        {inv.type === 'facture' && inv.status !== 'brouillon' && inv.status !== 'annulé' ? (
                          <div className="space-y-1">
                            <div className="text-green-600 font-medium">{fmt(paidOf(inv))}</div>
                            <div className={remainingOf(inv) > 0 ? 'text-amber-600' : 'text-muted-foreground'}>Reste {fmt(remainingOf(inv))}</div>
                            <div className="h-1.5 w-24 ml-auto rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-green-600" style={{ width: `${Number(inv.total) > 0 ? Math.min(100, (paidOf(inv) / Number(inv.total)) * 100) : 0}%` }} />
                            </div>
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => viewInvoice(inv)} title="Voir">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {inv.status !== 'annulé' && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(inv)} title="Modifier">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {inv.status === 'brouillon' && (
                            <Button variant="ghost" size="icon" onClick={() => updateStatus(inv, 'envoyé')} title="Marquer envoyé">
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          {inv.type === 'facture' && ['envoyé', 'partiel', 'payé'].includes(inv.status) && (
                            <Button variant="ghost" size="icon" onClick={() => openPayment(inv)} title="Paiements / tranches">
                              <Wallet className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {inv.status === 'payé' && paymentsOf(inv).length === 0 && (
                            <Button variant="ghost" size="icon" onClick={() => updateStatus(inv, 'envoyé')} title="Remettre en attente de paiement">
                              <XCircle className="w-4 h-4 text-amber-600" />
                            </Button>
                          )}
                          {inv.status !== 'annulé' && (
                            <Button variant="ghost" size="icon" onClick={() => setReminderInvoice(inv)} title="Relancer le client">
                              <BellRing className="w-4 h-4 text-primary" />
                            </Button>
                          )}
                          {(inv.status === 'brouillon' || inv.status === 'envoyé') && (
                            <Button variant="ghost" size="icon" onClick={() => updateStatus(inv, 'annulé')} title="Annuler">
                              <XCircle className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteInvoice(inv.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); setDialogOpen(v); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice
                ? `Modifier ${editingInvoice.type === 'facture' ? 'la facture' : 'le devis'}`
                : form.type === 'facture'
                  ? 'Nouvelle facture'
                  : 'Nouveau devis'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Numéro du document */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">
                  N° du document (modifiable)
                </label>
                <Input
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  placeholder="FAC-202601-0001"
                />
              </div>
            </div>

            {/* Émetteur (expéditeur) */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Émetteur de la facture</p>
                <Button variant="ghost" size="sm" onClick={() => setSender({})}>
                  Réinitialiser (valeurs par défaut)
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  ['senderName', 'Nom / entreprise'],
                  ['senderPhone', 'Téléphone'],
                  ['senderEmail', 'Email'],
                  ['senderAddress', 'Adresse'],
                  ['senderCity', 'Ville'],
                  ['paymentLabel', 'Moyen de paiement'],
                  ['paymentAccountLabel', 'Libellé du compte'],
                  ['paymentAccount', 'N° de compte'],
                  ['signatureLabel', 'Mention signature'],
                  ['currency', 'Devise'],
                ] as [keyof InvoiceSettings, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground">{label}</label>
                    <Input
                      value={sender[key] ?? settings[key] ?? ''}
                      onChange={(e) => setSender({ ...sender, [key]: e.target.value })}
                      placeholder={settings[key] || ''}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Client info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Nom du client *</label>
                <Input
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  placeholder="Nom du client"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  value={form.client_email}
                  onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                  placeholder="client@email.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Adresse</label>
              <Input
                value={form.client_address}
                onChange={(e) => setForm({ ...form, client_address: e.target.value })}
                placeholder="Adresse du client"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Date d'émission</label>
                <Input
                  type="date"
                  value={form.issue_date}
                  onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Date d'échéance</label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Taxe (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.tax_rate}
                  onChange={(e) => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Lignes</label>
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
                  <Plus className="w-3 h-3" /> Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItemTotal(idx, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qté"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItemTotal(idx, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Prix unit."
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateItemTotal(idx, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 text-right text-sm font-medium text-foreground">
                      {fmt(item.total)}
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span className="font-medium">{fmt(subtotal)}</span></div>
              {form.tax_rate > 0 && (
                <div className="flex justify-between"><span className="text-muted-foreground">Taxe ({form.tax_rate}%)</span><span className="font-medium">{fmt(taxAmount)}</span></div>
              )}
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{fmt(total)}</span></div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Conditions de paiement, informations supplémentaires..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>
              Annuler
            </Button>
            <Button onClick={saveInvoice}>
              {editingInvoice ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{viewingInvoice.type === 'facture' ? 'Facture' : 'Devis'} {viewingInvoice.invoice_number}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportPDF(viewingInvoice, viewItems)}
                    className="gap-1"
                  >
                    <Download className="w-4 h-4" /> PDF
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Client</p>
                    <p className="font-semibold text-foreground">{viewingInvoice.client_name}</p>
                    {viewingInvoice.client_email && <p className="text-muted-foreground">{viewingInvoice.client_email}</p>}
                    {viewingInvoice.client_address && <p className="text-muted-foreground">{viewingInvoice.client_address}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Date : {viewingInvoice.issue_date}</p>
                    {viewingInvoice.due_date && <p className="text-muted-foreground">Échéance : {viewingInvoice.due_date}</p>}
                    <span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_LABELS[viewingInvoice.status]?.color || 'bg-muted'}`}>
                      {STATUS_LABELS[viewingInvoice.status]?.label || viewingInvoice.status}
                    </span>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Qté</TableHead>
                      <TableHead className="text-right">Prix unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewItems.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{it.description}</TableCell>
                        <TableCell className="text-center">{it.quantity}</TableCell>
                        <TableCell className="text-right">{fmt(it.unit_price)}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(it.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="border-t border-border pt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{fmt(Number(viewingInvoice.subtotal))}</span></div>
                  {Number(viewingInvoice.tax_rate) > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Taxe ({viewingInvoice.tax_rate}%)</span><span>{fmt(Number(viewingInvoice.tax_amount))}</span></div>
                  )}
                  <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{fmt(Number(viewingInvoice.total))}</span></div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2 text-muted-foreground">
                    Prévisualisation du document (avant téléchargement)
                  </p>
                  <InvoicePreview
                    settings={effSettings(viewingInvoice)}
                    invoice={{
                      invoice_number: viewingInvoice.invoice_number,
                      type: viewingInvoice.type,
                      client_name: viewingInvoice.client_name,
                      client_email: viewingInvoice.client_email || '',
                      client_address: viewingInvoice.client_address || '',
                      issue_date: viewingInvoice.issue_date,
                      due_date: viewingInvoice.due_date,
                      notes: viewingInvoice.notes || '',
                      subtotal: Number(viewingInvoice.subtotal),
                      tax_rate: Number(viewingInvoice.tax_rate),
                      tax_amount: Number(viewingInvoice.tax_amount),
                      total: Number(viewingInvoice.total),
                      status: viewingInvoice.status,
                      paid_amount: paidOf(viewingInvoice),
                    }}
                    items={viewItems}
                    scale={0.6}
                  />
                </div>

                {viewingInvoice.notes && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p className="font-medium text-foreground mb-1">Notes</p>
                    <p className="text-muted-foreground">{viewingInvoice.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice template settings */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paramètres du modèle de facture</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Nom / société</label>
                <Input value={settings.senderName} onChange={(e) => setSettings({ ...settings, senderName: e.target.value })} placeholder="Africademia" />
              </div>
              <div>
                <label className="text-sm font-medium">Téléphone</label>
                <Input value={settings.senderPhone} onChange={(e) => setSettings({ ...settings, senderPhone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={settings.senderEmail} onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Adresse</label>
                <Input value={settings.senderAddress} onChange={(e) => setSettings({ ...settings, senderAddress: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Ville (ligne de date)</label>
                <Input value={settings.senderCity} onChange={(e) => setSettings({ ...settings, senderCity: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Devise (symbole)</label>
                <Input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Moyen de paiement</label>
              <Input value={settings.paymentLabel} onChange={(e) => setSettings({ ...settings, paymentLabel: e.target.value })} />
              <div className="flex flex-wrap gap-1 mt-2">
                {PAYMENT_PRESETS.map((p) => (
                  <Button key={p} type="button" size="sm" variant="outline" onClick={() => setSettings({ ...settings, paymentLabel: p })}>
                    {p.replace('Paiement effectuer par ', '').replace('Paiement par ', '')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Libellé du compte</label>
                <Input value={settings.paymentAccountLabel} onChange={(e) => setSettings({ ...settings, paymentAccountLabel: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">N° / IBAN / téléphone</label>
                <Input value={settings.paymentAccount} onChange={(e) => setSettings({ ...settings, paymentAccount: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Ligne signature</label>
                <Input value={settings.signatureLabel} onChange={(e) => setSettings({ ...settings, signatureLabel: e.target.value })} />
              </div>
              <div />
              <div>
                <label className="text-sm font-medium">Remerciement ligne 1</label>
                <Input value={settings.thanksLine1} onChange={(e) => setSettings({ ...settings, thanksLine1: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Remerciement ligne 2</label>
                <Input value={settings.thanksLine2} onChange={(e) => setSettings({ ...settings, thanksLine2: e.target.value })} />
              </div>
            </div>
          </div>
            <div className="lg:sticky lg:top-0 self-start">
              <p className="text-sm font-medium mb-2 text-muted-foreground">
                Prévisualisation live (exemple)
              </p>
              <InvoicePreview settings={settings} scale={0.5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettings(DEFAULT_INVOICE_SETTINGS)}>Réinitialiser</Button>
            <Button onClick={() => { saveInvoiceSettings(settings); setSettingsOpen(false); toast({ title: 'Modèle enregistré' }); }}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payments Dialog */}
      <Dialog open={!!payInvoice} onOpenChange={(open) => !open && setPayInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Paiements — {payInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {payInvoice && (() => {
            const paid = paidOf(payInvoice);
            const total = Number(payInvoice.total);
            const rest = remainingOf(payInvoice);
            const list = paymentsOf(payInvoice);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-md bg-muted p-2"><p className="text-muted-foreground text-xs">Total</p><p className="font-semibold">{fmt(total)}</p></div>
                  <div className="rounded-md bg-muted p-2"><p className="text-muted-foreground text-xs">Payé</p><p className="font-semibold text-green-600">{fmt(paid)}</p></div>
                  <div className="rounded-md bg-muted p-2"><p className="text-muted-foreground text-xs">Reliquat</p><p className="font-semibold text-amber-600">{fmt(rest)}</p></div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-green-600 transition-all" style={{ width: `${total > 0 ? Math.min(100, (paid / total) * 100) : 0}%` }} />
                </div>
                {list.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Tranches reçues</p>
                    {list.map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">Tranche {i + 1} · {fmt(p.amount)}</span>
                          <span className="text-muted-foreground ml-2">{p.date}{p.note ? ` — ${p.note}` : ''}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteInvoicePayment(payInvoice, p)} title="Supprimer la tranche">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {rest > 0 ? (
                  <div className="space-y-2 border-t border-border pt-3">
                    <p className="text-sm font-medium">Enregistrer une tranche</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" min={0} placeholder="Montant" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
                      <Input type="date" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} />
                    </div>
                    <Input placeholder="Note (ex : 1ère tranche, Orange Money…)" value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} />
                    <Button className="w-full gap-2" onClick={addInvoicePayment}><CheckCircle className="w-4 h-4" /> Marquer cette tranche payée</Button>
                    <p className="text-xs text-muted-foreground">Chaque tranche est ajoutée automatiquement à vos revenus (Transactions, tableau de bord, fiscalité).</p>
                  </div>
                ) : (
                  <p className="text-sm text-green-600 font-medium text-center">Facture entièrement payée ✓</p>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayInvoice(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={!!reminderInvoice} onOpenChange={(open) => !open && setReminderInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Relancer le client</DialogTitle>
          </DialogHeader>
          {reminderInvoice && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Message de relance pour {reminderInvoice.client_name} — {reminderInvoice.invoice_number} ({fmt(Number(reminderInvoice.total))})
              </p>
              <Textarea
                id="reminder-text"
                rows={8}
                defaultValue={`Bonjour ${reminderInvoice.client_name},\n\nJe me permets de vous relancer concernant la ${reminderInvoice.type} ${reminderInvoice.invoice_number} d'un montant de ${_fmt(Number(reminderInvoice.total))}${paidOf(reminderInvoice) > 0 ? ` (déjà réglé : ${_fmt(paidOf(reminderInvoice))}, reste à payer : ${_fmt(remainingOf(reminderInvoice))})` : ''}${reminderInvoice.due_date ? `, dont l'échéance était le ${reminderInvoice.due_date}` : ''}.\n\nMerci de bien vouloir procéder au règlement ou de me tenir informé.\n\nCordialement`}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById('reminder-text') as HTMLTextAreaElement;
                    navigator.clipboard.writeText(el.value);
                    toast({ title: 'Message copié' });
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copier
                </Button>
                {reminderInvoice.client_email && (
                  <Button
                    onClick={() => {
                      const el = document.getElementById('reminder-text') as HTMLTextAreaElement;
                      window.open(`mailto:${reminderInvoice.client_email}?subject=${encodeURIComponent(`Relance ${reminderInvoice.invoice_number}`)}&body=${encodeURIComponent(el.value)}`, '_blank');
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" /> Envoyer par e-mail
                  </Button>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderInvoice(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
