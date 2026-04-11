import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { userId } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setLoadingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Un email de confirmation a été envoyé à votre nouvelle adresse.');
      setNewEmail('');
    }
    setLoadingEmail(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Mot de passe modifié avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoadingPassword(false);
  };

  return (
    <div className="space-y-8 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Gérez votre compte et vos préférences</p>
      </div>

      {/* Change Email */}
      <form onSubmit={handleEmailChange} className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Modifier l'adresse email</h2>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nouvelle adresse email</label>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            placeholder="nouvelle@email.com"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loadingEmail}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {loadingEmail ? 'Envoi...' : 'Mettre à jour l\'email'}
        </button>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePasswordChange} className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Modifier le mot de passe</h2>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full h-11 px-4 pr-12 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              placeholder="Nouveau mot de passe"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full h-11 px-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            placeholder="Confirmer le mot de passe"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loadingPassword}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {loadingPassword ? 'Modification...' : 'Modifier le mot de passe'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
