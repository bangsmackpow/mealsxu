import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Key, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({ email: '', oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const data = JSON.parse(userStr);
    setUser(data);
    setFormData(prev => ({ ...prev, email: data.email }));
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        // Update local user data if email changed
        const updatedUser = { ...user, email: formData.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        const data = await response.json();
        setError(data.error || 'Update failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-2">User Profile</h1>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Manage your account credentials and security.</p>
      </header>

      <div className="bg-card border-2 border-border/50 rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden">
        <div className="p-8 md:p-12">
          {success && (
            <div className="mb-8 bg-emerald-50 border-2 border-emerald-100 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm font-black uppercase tracking-widest">Profile Updated Successfully</p>
            </div>
          )}

          {error && (
            <div className="mb-8 bg-red-50 border-2 border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Email Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Account Information</h3>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Email Address</label>
                <input 
                  required
                  type="email"
                  className="w-full h-14 bg-muted/30 border-2 border-border/50 rounded-2xl px-5 font-black focus:border-primary outline-none transition-all shadow-inner"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4 pt-4 border-t-2 border-border/20">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Security Protocol</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Current Password</label>
                <input 
                  required={!!formData.newPassword}
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-14 bg-muted/30 border-2 border-border/50 rounded-2xl px-5 font-black focus:border-primary outline-none transition-all shadow-inner"
                  value={formData.oldPassword}
                  onChange={e => setFormData({...formData, oldPassword: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">New Password</label>
                  <input 
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="w-full h-14 bg-muted/30 border-2 border-border/50 rounded-2xl px-5 font-black focus:border-primary outline-none transition-all shadow-inner"
                    value={formData.newPassword}
                    onChange={e => setFormData({...formData, newPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground">Confirm New Password</label>
                  <input 
                    type="password"
                    className="w-full h-14 bg-muted/30 border-2 border-border/50 rounded-2xl px-5 font-black focus:border-primary outline-none transition-all shadow-inner"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit" 
              className="w-full py-5 bg-primary text-primary-foreground rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 group italic"
            >
              {loading ? 'Processing...' : (
                <>
                  Commit Changes <Save className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
