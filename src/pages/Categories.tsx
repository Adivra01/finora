import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Plus, Trash2, Tag } from 'lucide-react';
import type { CategoryGroup } from '@/lib/types';

const groupLabels: Record<CategoryGroup, string> = {
  depense: 'Dépenses',
  revenu: 'Revenus',
  business: 'Business',
};

const groupColors: Record<CategoryGroup, string> = {
  depense: 'bg-destructive/10 text-destructive',
  revenu: 'bg-success/10 text-success',
  business: 'bg-info/10 text-info',
};

const Categories = () => {
  const { data, addCategory, deleteCategory } = useData();
  const [name, setName] = useState('');
  const [group, setGroup] = useState<CategoryGroup>('depense');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory({ name: name.trim(), group });
    setName('');
  };

  const groups: CategoryGroup[] = ['depense', 'revenu', 'business'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Catégories</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos catégories de transactions</p>
      </div>

      <form onSubmit={handleAdd} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Nouvelle catégorie</h3>
        <div className="flex gap-3">
          <select value={group} onChange={e => setGroup(e.target.value as CategoryGroup)}
            className="h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
            {groups.map(g => <option key={g} value={g}>{groupLabels[g]}</option>)}
          </select>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la catégorie"
            className="flex-1 h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button type="submit" className="flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
            <Plus className="w-4 h-4" />Ajouter
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {groups.map(g => (
          <div key={g} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{groupLabels[g]}</h3>
              <span className="text-xs text-muted-foreground">({data.categories.filter(c => c.group === g).length})</span>
            </div>
            <div className="space-y-2">
              {data.categories.filter(c => c.group === g).map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${groupColors[g]}`}>
                    {c.name}
                  </span>
                  <button onClick={() => deleteCategory(c.id)} className="p-1 rounded hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {data.categories.filter(c => c.group === g).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Aucune catégorie</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
