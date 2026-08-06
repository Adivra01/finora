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
} from 'lucide-react';
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
  'payé': { label: 'Payé', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  'annulé': { label: 'Annulé', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(n) + ' XOF';

export default function Facturation() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
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
    client_name: '',
    client_email: '',
    client_address: '',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    notes: '',
    tax_rate: 0,
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
  };

  const openNew = (type: string) => {
    resetForm();
    setForm((f) => ({ ...f, type }));
    setDialogOpen(true);
  };

  const openEdit = async (inv: Invoice) => {
    setEditingInvoice(inv);
    setForm({
      type: inv.type,
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
      invoice_number: editingInvoice ? editingInvoice.invoice_number : generateNumber(form.type),
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
    const html = buildInvoiceHTML(inv, invItems, settings);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 800);
    }
  };

  const filtered = invoices.filter((inv) => {
    if (filterType !== 'all' && inv.type !== filterType) return false;
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    totalFactures: invoices.filter((i) => i.type === 'facture').length,
    totalDevis: invoices.filter((i) => i.type === 'devis').length,
    enAttente: invoices.filter((i) => i.status === 'envoyé').reduce((s, i) => s + Number(i.total), 0),
    totalPaye: invoices.filter((i) => i.status === 'payé').reduce((s, i) => s + Number(i.total), 0),
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
            <p className="text-sm text-muted-foreground">En attente</p>
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
        {(['all', 'brouillon', 'envoyé', 'payé', 'annulé'] as const).map((s) => (
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
                          {inv.status === 'brouillon' && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(inv)} title="Modifier">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => updateStatus(inv, 'envoyé')} title="Marquer envoyé">
                                <Send className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {inv.status === 'envoyé' && (
                            <Button variant="ghost" size="icon" onClick={() => updateStatus(inv, 'payé')} title="Marquer payé">
                              <CheckCircle className="w-4 h-4 text-green-600" />
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paramètres du modèle de facture</DialogTitle>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettings(DEFAULT_INVOICE_SETTINGS)}>Réinitialiser</Button>
            <Button onClick={() => { saveInvoiceSettings(settings); setSettingsOpen(false); toast({ title: 'Modèle enregistré' }); }}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
