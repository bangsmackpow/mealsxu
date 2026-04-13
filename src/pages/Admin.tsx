import React, { useState, useEffect } from 'react';
import { Users, BookOpen, BarChart3, Shield, Search, MoreVertical, Archive, Key, Trash2, X, AlertCircle } from 'lucide-react';

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
  const navigate = useNavigate();

  // User Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'user' });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    Promise.all([fetchMetrics(), fetchUsers()]).finally(() => setLoading(false));
  }, []);

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

  if (loading) return <div className="p-20 text-center font-bold text-primary animate-pulse text-2xl tracking-tighter">MEALSXU ADMIN LOADING...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2 text-foreground uppercase">Admin Dashboard</h1>
        <p className="text-muted-foreground font-medium">System-wide control and performance tracking.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-8 overflow-x-auto pb-px">
        {['dashboard', 'users', 'recipes'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-black text-sm uppercase tracking-widest transition-all border-b-4 -mb-[2px] ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && metrics && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Recipes" value={metrics.totalRecipes} icon={<BookOpen />} color="bg-orange-500" />
            <StatCard label="Total Users" value={metrics.totalUsers} icon={<Users />} color="bg-blue-500" />
            <StatCard label="Avg. Views" value="42" icon={<BarChart3 />} color="bg-emerald-500" />
            <StatCard label="Conversions" value="12%" icon={<Shield />} color="bg-purple-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MetricList title="Top Visited Recipes" items={metrics.topVisited.map(r => ({ label: r.title, value: `${r.views} views` }))} />
            <MetricList title="Top Put in Cart" items={metrics.topInCart.map(r => ({ label: r.title, value: `${r.cart_adds} adds` }))} />
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-card border-2 border-border/50 rounded-2xl overflow-hidden shadow-xl shadow-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input 
                placeholder="Search users..." 
                className="pl-10 h-10 w-full rounded-xl border-2 border-border/50 bg-background px-3 py-1 text-sm focus:border-primary/50 focus:ring-0 transition-all"
              />
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Add New User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-black tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">Identitifer</th>
                  <th className="px-8 py-5">Role</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {users.map((user) => (
                  <tr key={user.id} className={`hover:bg-primary/5 transition-colors ${user.is_archived ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-inner">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground leading-none mb-1">{user.email}</span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${user.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm">
                      {user.is_archived ? 
                        <span className="text-red-500 font-bold text-[10px] uppercase tracking-tighter flex items-center gap-1.5"><AlertCircle className="h-3 w-3" /> Archived</span> : 
                        <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-tighter flex items-center gap-1.5"><Shield className="h-3 w-3" /> Active</span>
                      }
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => { setEditingUser(user); setFormData({ email: user.email, password: '', role: user.role }); }}
                          className="p-2.5 hover:bg-background border-2 border-transparent hover:border-border rounded-xl text-muted-foreground hover:text-primary transition-all" 
                          title="Edit User"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => toggleArchive(user)}
                          className="p-2.5 hover:bg-background border-2 border-transparent hover:border-border rounded-xl text-muted-foreground hover:text-orange-600 transition-all" 
                          title={user.is_archived ? "Restore" : "Archive"}
                        >
                          <Archive className="h-4 w-4" />
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

      {/* User Modal (Create/Edit) */}
      {(isCreateModalOpen || editingUser) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border-4 border-primary/20 rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <header className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter">{editingUser ? 'Update User' : 'New User'}</h2>
              <button onClick={() => { setEditingUser(null); setIsCreateModalOpen(false); }} className="p-2 hover:bg-muted rounded-full"><X /></button>
            </header>
            <form onSubmit={handleSaveUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Email Address</label>
                <input 
                  required
                  type="email"
                  className="w-full h-12 bg-background border-2 border-border/50 rounded-xl px-4 font-bold focus:border-primary outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Password {editingUser && '(Leave blank to keep current)'}</label>
                <input 
                  required={!editingUser}
                  type="password"
                  className="w-full h-12 bg-background border-2 border-border/50 rounded-xl px-4 font-bold focus:border-primary outline-none transition-all"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">System Role</label>
                <select 
                  className="w-full h-12 bg-background border-2 border-border/50 rounded-xl px-4 font-bold focus:border-primary outline-none transition-all"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">USER</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 mt-4">
                {editingUser ? 'Update Credentials' : 'Create User Account'}
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
    <div className="bg-card border-2 border-border/50 rounded-2xl p-6 shadow-sm hover:border-primary/20 transition-all group">
      <div className={`h-12 w-12 ${color} text-white rounded-xl flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'h-6 w-6 font-black' })}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-black tracking-tighter text-foreground">{value}</p>
    </div>
  );
}

function MetricList({ title, items }: { title: string, items: { label: string, value: string }[] }) {
  return (
    <div className="bg-card border-2 border-border/50 rounded-2xl p-8">
      <h3 className="text-xl font-black uppercase tracking-tighter mb-6 border-b-2 border-primary/10 pb-4">{title}</h3>
      <div className="space-y-4">
        {items.length > 0 ? items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/20 transition-all cursor-default">
            <span className="font-bold text-sm text-foreground line-clamp-1">{item.label}</span>
            <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-lg whitespace-nowrap">{item.value}</span>
          </div>
        )) : <p className="text-center py-10 text-muted-foreground italic font-medium">No activity recorded yet.</p>}
      </div>
    </div>
  );
}
