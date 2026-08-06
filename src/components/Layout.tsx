import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import {
  ArrowRightLeft,
  ClipboardList,
  CreditCard,
  DollarSign,
  Download,
  HardDrive,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Tags,
  TrendingUp,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { to: '/a-payer', label: 'À payer', icon: CreditCard },
  { to: '/depenses-prevues', label: 'Dépenses prévues', icon: ClipboardList },
  { to: '/investissements', label: 'Investissements', icon: TrendingUp },
  { to: '/fiscalite', label: 'Fiscalité', icon: Landmark },
  { to: '/facturation', label: 'Facturation', icon: FileText },
  { to: '/sauvegardes', label: 'Sauvegardes', icon: HardDrive },
  { to: '/categories', label: 'Catégories', icon: Tags },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
];

export function Layout() {
  const { logout } = useAuth();
  const { exportData } = useData();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comptabilite-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-card border-r border-border">
      <div className="flex items-center gap-2 h-16 px-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold font-display text-foreground">Fintrack</span>
        <button className="ml-auto lg:hidden text-muted-foreground" onClick={() => setOpen(false)} aria-label="Fermer le menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <button
          onClick={handleExport}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <Download className="w-4 h-4" /> Exporter
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition"
        >
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-40">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full">{sidebar}</div>
          <div className="flex-1 bg-foreground/40" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="lg:pl-64">
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border h-16 flex items-center px-4 gap-3">
          <button onClick={() => setOpen(true)} className="text-foreground" aria-label="Ouvrir le menu">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold font-display text-foreground">Fintrack</span>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
