import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Database, Download, Trash2, RefreshCw, Shield, Clock } from 'lucide-react';

interface BackupEntry {
  id: string;
  backup_date: string;
  tables_included: string[];
  created_at: string;
  sql_content: string;
}

const TABLE_NAMES = ['transactions', 'payables', 'payments', 'investments', 'categories', 'planned_expenses', 'fiscal_data'] as const;

export default function Backups() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchBackups = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('data_backups')
      .select('*')
      .order('created_at', { ascending: false });
    setBackups((data as any) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const generateBackup = useCallback(async () => {
    if (!userId) return;
    setGenerating(true);

    try {
      const results: Record<string, any[]> = {};
      for (const table of TABLE_NAMES) {
        const { data } = await supabase.from(table).select('*');
        results[table] = data || [];
      }

      let sql = `-- FinTrack Backup\n-- Date: ${new Date().toISOString()}\n-- User: ${userId}\n\n`;

      for (const table of TABLE_NAMES) {
        const rows = results[table];
        if (rows.length === 0) {
          sql += `-- Table ${table}: (vide)\n\n`;
          continue;
        }
        sql += `-- Table: ${table} (${rows.length} lignes)\n`;
        for (const row of rows) {
          const cols = Object.keys(row);
          const vals = cols.map(c => {
            const v = row[c];
            if (v === null) return 'NULL';
            if (typeof v === 'number' || typeof v === 'boolean') return String(v);
            return `'${String(v).replace(/'/g, "''")}'`;
          });
          sql += `INSERT INTO public.${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`;
        }
        sql += '\n';
      }

      const tablesWithData = TABLE_NAMES.filter(t => results[t].length > 0);

      const { error } = await supabase.from('data_backups').insert({
        user_id: userId,
        sql_content: sql,
        tables_included: tablesWithData,
        backup_date: new Date().toISOString().slice(0, 10),
      } as any);

      if (error) throw error;

      toast({ title: '✅ Sauvegarde créée', description: `${tablesWithData.length} tables sauvegardées.` });
      fetchBackups();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }, [userId, toast, fetchBackups]);

  const downloadBackup = (backup: BackupEntry) => {
    const blob = new Blob([backup.sql_content], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-backup-${backup.backup_date}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteBackup = async (id: string) => {
    if (!window.confirm('Supprimer cette sauvegarde ?')) return;
    await supabase.from('data_backups').delete().eq('id', id);
    setBackups(prev => prev.filter(b => b.id !== id));
    toast({ title: 'Supprimé', description: 'Sauvegarde supprimée.' });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sauvegardes</h1>
            <p className="text-sm text-muted-foreground">Exportez et conservez vos données en SQL</p>
          </div>
        </div>
        <Button onClick={generateBackup} disabled={generating} className="gap-2">
          {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {generating ? 'Génération...' : 'Nouvelle sauvegarde'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : backups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucune sauvegarde</p>
            <p className="text-sm text-muted-foreground mt-1">Cliquez sur "Nouvelle sauvegarde" pour exporter vos données.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {backups.map(b => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Sauvegarde du {new Date(b.backup_date).toLocaleDateString('fr-FR')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {b.tables_included.map(t => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => downloadBackup(b)}>
                    <Download className="w-3.5 h-3.5" />
                    SQL
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteBackup(b.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}