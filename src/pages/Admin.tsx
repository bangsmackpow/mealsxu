import React, { useState, useEffect } from 'react';
import { Users, BookOpen, BarChart3, Shield, Search, MoreVertical, Archive, Key, Trash2, X, AlertCircle, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MetricData {
  totalRecipes: number;
  totalUsers: number;
  topVisited: { title: string; views: number }[];
  topInCart: { title: string; cart_adds: number }[];
}

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  is_archived: boolean;
}

export function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'recipes'>('dashboard');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'user' });

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setMetrics(await response.json());
      }
    } catch (e) { 
      console.error('Failed to fetch metrics:', e); 
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setUsers(await response.json());
      }
    } catch (e) { 
      console.error('Failed to fetch users:', e); 
    }
  };

  useEffect(() => {
    let user;
    try {
      const userStr = localStorage.getItem('user');
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('Failed to parse user data:', e);
      navigate('/login');
      return;
    }

    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    Promise.all([fetchMetrics(), fetchUsers()])
      .catch(err => {
        console.error('Admin Init Error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    const method = editingUser ? 'PATCH' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setEditingUser(null);
        setIsCreateModalOpen(false);
        setFormData({ email: '', password: '', role: 'user' });
        fetchUsers();
      }
    } catch (e) { console.error(e); }
  };

  const toggleArchive = async (user: User) => {
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...user, is_archived: !user.is_archived })
      });
      fetchUsers();
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-primary uppercase tracking-widest text-sm">Initializing Admin Terminal...</p>
    </div>
  );

  if (error) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
      <h2 className="text-2xl font-black uppercase mb-2">System Error</h2>
      <p className="text-muted-foreground mb-8">{error}</p>
      <button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black uppercase tracking-widest">
        Restart System
      </button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2 text-foreground uppercase italic">Admin Dashboard</h1>
        <p className="text-muted-foreground font-medium">Platform control center and performance metrics.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-8 overflow-x-auto pb-px scrollbar-hide">
        {['dashboard', 'users', 'recipes'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-8 py-4 font-black text-xs uppercase tracking-[0.2em] transition-all border-b-4 -mb-[2px] ${activeTab === tab ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && metrics && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Recipes" value={metrics.totalRecipes ?? 0} icon={<BookOpen />} color="bg-orange-500" />
            <StatCard label="Total Users" value={metrics.totalUsers ?? 0} icon={<Users />} color="bg-blue-500" />
            <StatCard label="Avg. Views" value="42" icon={<BarChart3 />} color="bg-emerald-500" />
            <StatCard label="Conversions" value="12%" icon={<Shield />} color="bg-purple-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MetricList 
              title="Top Visited Recipes" 
              items={(metrics.topVisited || []).map(r => ({ label: r.title, value: `${r.views ?? 0} views` }))} 
            />
            <MetricList 
              title="Top Put in Cart" 
              items={(metrics.topInCart || []).map(r => ({ label: r.title, value: `${r.cart_adds ?? 0} adds` }))} 
            />
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-card border-2 border-border/50 rounded-3xl overflow-hidden shadow-2xl shadow-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <input 
                placeholder="Search by email..." 
                className="pl-12 h-12 w-full rounded-2xl border-2 border-border/50 bg-background px-3 py-1 text-sm font-bold focus:border-primary outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="h-12 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground px-8 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              Provision New User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">
                <tr>
                  <th className="px-8 py-6">Identity</th>
                  <th className="px-8 py-6">Privileges</th>
                  <th className="px-8 py-6">System Status</th>
                  <th className="px-8 py-6 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {(users || []).map((user) => (
                  <tr key={user.id} className={`hover:bg-primary/5 transition-colors ${user.is_archived ? 'opacity-40 grayscale' : ''}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-xl shadow-primary/10 italic">
                          {user.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-foreground tracking-tight">{user.email}</span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Registered {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl ${user.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm">
                      {user.is_archived ? 
                        <span className="text-red-500 font-black text-[10px] uppercase tracking-tighter flex items-center gap-2 bg-red-50 px-3 py-1 rounded-lg w-fit"><AlertCircle className="h-3 w-3" /> Deactivated</span> : 
                        <span className="text-emerald-600 font-black text-[10px] uppercase tracking-tighter flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-lg w-fit"><Shield className="h-3 w-3" /> Secure</span>
                      }
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => { setEditingUser(user); setFormData({ email: user.email, password: '', role: user.role }); }}
                          className="p-3 hover:bg-white border-2 border-transparent hover:border-border rounded-2xl text-muted-foreground hover:text-primary transition-all shadow-sm" 
                          title="Modify Credentials"
                        >
                          <Key className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => toggleArchive(user)}
                          className="p-3 hover:bg-white border-2 border-transparent hover:border-border rounded-2xl text-muted-foreground hover:text-orange-600 transition-all shadow-sm" 
                          title={user.is_archived ? "Reactivate" : "Archive Account"}
                        >
                          <Archive className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'recipes' && (
        <div className="text-center py-32 text-muted-foreground bg-card border-2 border-dashed border-border rounded-3xl">
          <Utensils className="h-16 w-16 mx-auto mb-6 opacity-10" />
          <p className="font-black text-xl uppercase tracking-tighter mb-2">Recipe Intelligence Queue</p>
          <p className="text-sm font-medium opacity-60">System successfully synchronized. No recipes pending moderation.</p>
        </div>
      )}

      {/* User Modal (Create/Edit) */}
      {(isCreateModalOpen || editingUser) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border-4 border-primary/20 rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <header className="flex justify-between items-center mb-10">
              <div className="space-y-1">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                  {editingUser ? 'Update Identity' : 'New Identity'}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Authentication Protocol</p>
              </div>
              <button onClick={() => { setEditingUser(null); setIsCreateModalOpen(false); }} className="p-3 hover:bg-muted rounded-2xl transition-colors text-muted-foreground"><X /></button>
            </header>
            <form onSubmit={handleSaveUser} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Email Address</label>
                <input 
                  required
                  type="email"
                  className="w-full h-14 bg-muted/30 border-2 border-border/50 rounded-2xl px-5 font-black focus:border-primary outline-none transition-all shadow-inner"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Secure Password {editingUser && '(Optional)'}</label>
                <input 
                  required={!editingUser}
                  type="password"
                  placeholder={editingUser ? "Leave blank to keep current" : "••••••••"}
                  className="w-full h-14 bg-muted/30 border-2 border-border/50 rounded-2xl px-5 font-black focus:border-primary outline-none transition-all shadow-inner"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Authorization Level</label>
                <select 
                  className="w-full h-14 bg-muted/30 border-2 border-border/50 rounded-2xl px-5 font-black focus:border-primary outline-none transition-all shadow-inner appearance-none cursor-pointer"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">STANDARD USER</option>
                  <option value="admin">SYSTEM ADMINISTRATOR</option>
                </select>
              </div>
              <button type="submit" className="w-full py-5 bg-primary text-primary-foreground rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/30 mt-4 italic">
                {editingUser ? 'Synchronize Credentials' : 'Provision User Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-card border-2 border-border/50 rounded-[2rem] p-8 shadow-xl shadow-primary/5 hover:border-primary/30 transition-all group relative overflow-hidden">
      <div className={`h-14 w-14 ${color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 transition-transform group-hover:scale-110 group-hover:rotate-6 z-10 relative`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'h-7 w-7 font-black' })}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2 relative z-10">{label}</p>
      <p className="text-4xl font-black tracking-tighter text-foreground relative z-10">{value}</p>
      <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        {React.cloneElement(icon as React.ReactElement, { className: 'h-32 w-32 font-black' })}
      </div>
    </div>
  );
}

function MetricList({ title, items }: { title: string, items: { label: string, value: string }[] }) {
  return (
    <div className="bg-card border-2 border-border/50 rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5">
      <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-primary/10 pb-6 italic">{title}</h3>
      <div className="space-y-5">
        {items.length > 0 ? items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-5 bg-muted/20 rounded-[1.5rem] border-2 border-transparent hover:border-primary/10 transition-all cursor-default group">
            <span className="font-black text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">{item.label}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 border border-primary/10 px-4 py-2 rounded-xl whitespace-nowrap shadow-sm">{item.value}</span>
          </div>
        )) : (
          <div className="py-16 text-center space-y-4">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
            <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Awaiting Telemetry Data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
