import { useData } from '@/contexts/DataContext';
import { TrendingUp, TrendingDown, Calendar as CalendarIcon, DollarSign, Filter, FolderOpen, PieChart as PieChartIcon, BarChart3, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useState, useMemo } from 'react';

const formatMoney = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Dashboard = () => {
  const { data, totalRevenus, totalDepenses, totalAPayer, solde } = useData();
  const [filterType, setFilterType] = useState<'tous' | 'revenu' | 'depense'>('tous');
  const [filterPeriod, setFilterPeriod] = useState<'tous' | 'mois' | 'annee'>('tous');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return data.transactions.filter(t => {
      if (filterType !== 'tous' && t.type !== filterType) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      if (filterPeriod === 'tous') return true;
      const d = new Date(t.date);
      if (filterPeriod === 'mois') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return d.getFullYear() === now.getFullYear();
    });
  }, [data.transactions, filterType, filterPeriod, filterCategory]);

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'depense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const revenuesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'revenu').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const year = new Date().getFullYear();
    return months.map((name, i) => {
      const monthTx = data.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === i && d.getFullYear() === year;
      });
      return {
        name,
        revenus: monthTx.filter(t => t.type === 'revenu').reduce((s, t) => s + t.amount, 0),
        depenses: monthTx.filter(t => t.type === 'depense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [data.transactions]);

  const usedCategories = [...new Set(data.transactions.map(t => t.category))];

  const stats = [
    { 
      label: 'REVENUS', 
      value: totalRevenus, 
      icon: TrendingUp, 
      cardClass: 'stat-card-success',
      iconClass: 'icon-circle-success',
      valueClass: 'text-foreground',
      subtitle: 'Entrées d\'argent'
    },
    { 
      label: 'DÉPENSES', 
      value: totalDepenses, 
      icon: TrendingDown, 
      cardClass: 'stat-card-destructive',
      iconClass: 'icon-circle-destructive',
      valueClass: 'text-foreground',
      subtitle: 'Sorties d\'argent'
    },
    { 
      label: 'À PAYER', 
      value: totalAPayer, 
      icon: CalendarIcon, 
      cardClass: 'stat-card-warning',
      iconClass: 'icon-circle-warning',
      valueClass: 'text-warning',
      subtitle: 'Reste à payer'
    },
    { 
      label: 'SOLDE NET', 
      value: solde, 
      icon: DollarSign, 
      cardClass: 'stat-card-info',
      iconClass: 'icon-circle-info',
      valueClass: solde >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive',
      subtitle: solde >= 0 ? 'Situation positive' : 'Situation négative'
    },
  ];

  const renderEmptyChart = () => (
    <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
      <PieChartIcon className="w-16 h-16 mb-3 opacity-20" />
      <p className="text-sm">Aucune donnée disponible</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Filter className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Filtres d'affichage</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Type</label>
            <div className="relative">
              <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as 'tous' | 'revenu' | 'depense')}
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
              >
                <option value="tous">Tous les types</option>
                <option value="revenu">Revenus</option>
                <option value="depense">Dépenses</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Période</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={filterPeriod}
                onChange={e => setFilterPeriod(e.target.value as 'tous' | 'mois' | 'annee')}
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
              >
                <option value="tous">Toute la période</option>
                <option value="mois">Ce mois</option>
                <option value="annee">Cette année</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Catégorie</label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
              >
                <option value="">Toutes les catégories</option>
                {usedCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.cardClass} hover-lift`}>
            <div className="flex items-start justify-between">
              <div className="pl-3">
                <p className="text-xs font-medium text-muted-foreground tracking-wide mb-1">{s.label}</p>
                <p className={`text-2xl font-bold font-display ${s.valueClass}`}>
                  {formatMoney(s.value)}
                </p>
                <p className={`text-xs mt-1 ${s.valueClass === 'text-foreground' ? 'text-[hsl(var(--success))]' : s.valueClass}`}>
                  {s.subtitle}
                </p>
              </div>
              <div className={`icon-circle ${s.iconClass}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4 text-destructive" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Dépenses par catégorie</h3>
          </div>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={expensesByCategory} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={100} 
                  paddingAngle={2} 
                  dataKey="value"
                  stroke="none"
                >
                  {expensesByCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '8px', 
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => formatMoney(value)}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : renderEmptyChart()}
        </div>

        {/* Revenue by Category */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--success))]/10 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4 text-[hsl(var(--success))]" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Revenus par catégorie</h3>
          </div>
          {revenuesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={revenuesByCategory} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={100} 
                  paddingAngle={2} 
                  dataKey="value"
                  stroke="none"
                >
                  {revenuesByCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '8px', 
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => formatMoney(value)}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : renderEmptyChart()}
        </div>
      </div>

      {/* 12-month Evolution */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Évolution sur 12 mois</h3>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => value > 0 ? `${(value / 1000).toFixed(0)}k` : '0'}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))', 
                borderRadius: '8px', 
                color: 'hsl(var(--foreground))',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => formatMoney(value)}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
            />
            <Line 
              type="monotone" 
              dataKey="revenus" 
              stroke="hsl(145, 65%, 42%)" 
              strokeWidth={3} 
              dot={{ r: 4, fill: 'hsl(145, 65%, 42%)' }} 
              name="Revenus" 
            />
            <Line 
              type="monotone" 
              dataKey="depenses" 
              stroke="hsl(0, 72%, 51%)" 
              strokeWidth={3} 
              dot={{ r: 4, fill: 'hsl(0, 72%, 51%)' }} 
              name="Dépenses" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Transactions récentes</h3>
        </div>
        {data.transactions.length > 0 ? (
          <div className="space-y-2">
            {data.transactions.slice(-5).reverse().map(t => (
              <div key={t.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50 hover:bg-muted transition">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    t.type === 'revenu' ? 'bg-[hsl(var(--success))]/10' : 'bg-destructive/10'
                  }`}>
                    {t.type === 'revenu' ? (
                      <TrendingUp className="w-4 h-4 text-[hsl(var(--success))]" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.description || t.category}</p>
                    <p className="text-xs text-muted-foreground">{t.category} · {new Date(t.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'revenu' ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                  {t.type === 'revenu' ? '+' : '-'}{formatMoney(t.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <ArrowRightLeft className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Aucune transaction enregistrée</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ArrowRightLeft = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>
  </svg>
);

export default Dashboard;
