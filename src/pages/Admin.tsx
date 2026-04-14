import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, BarChart3, Shield, Search, MoreVertical, Archive, 
  Key, Trash2, X, AlertCircle, Utensils, Settings, History, Save, Send 
} from 'lucide-react';
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

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  details: string;
  created_at: string;
}

export function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings' | 'logs'>('dashboard');
  const navigate = useNavigate();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({ email: '', password: '', role: 'user' });

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) setMetrics(await response.json());
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) setUsers(await response.json());
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const s: Record<string, string> = {};
        data.forEach((item: any) => s[item.key] = item.value);
        setSettings(s);
      }
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) setLogs(await response.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    Promise.all([fetchMetrics(), fetchUsers(), fetchSettings(), fetchLogs()]).finally(() => setLoading(false));
  }, [navigate]);

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) alert('Settings Saved');
    } catch (e) { console.error(e); }
  };

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
        body: JSON.stringify(userFormData)
      });
      if (res.ok) {
        setEditingUser(null);
        setIsCreateModalOpen(false);
        setUserFormData({ email: '', password: '', role: 'user' });
        fetchUsers();
        fetchLogs();
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-20 text-center font-black text-primary animate-pulse text-2xl tracking-tighter italic">Initializing Admin Terminal...</div>;

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-foreground uppercase italic border-l-8 border-primary pl-6">Command Center</h1>
          <p className="text-muted-foreground font-medium text-xs uppercase tracking-widest">Platform Infrastructure & User Intelligence</p>
        </div>
      </header>

      <div className="flex gap-2 border-b mb-8 overflow-x-auto pb-px scrollbar-hide">
        {[
          { id: 'dashboard', icon: <BarChart3 className="h-4 w-4" />, label: 'Intelligence' },
          { id: 'users', icon: <Users className="h-4 w-4" />, label: 'Identities' },
          { id: 'settings', icon: <Settings className="h-4 w-4" />, label: 'Settings' },
          { id: 'logs', icon: <History className="h-4 w-4" />, label: 'Audit Log' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all border-b-4 -mb-[2px] flex items-center gap-2 ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && metrics && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Live Recipes" value={metrics.totalRecipes} icon={<BookOpen />} color="bg-orange-500" />
            <StatCard label="Active Users" value={metrics.totalUsers} icon={<Users />} color="bg-blue-500" />
            <StatCard label="Avg Views" value="42" icon={<BarChart3 />} color="bg-emerald-500" />
            <StatCard label="Cart Yield" value="12%" icon={<Shield />} color="bg-purple-500" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MetricList title="High-Performance Recipes" items={(metrics.topVisited || []).map(r => ({ label: r.title, value: `${r.views} views` }))} />
            <MetricList title="Conversion Leaders" items={(metrics.topInCart || []).map(r => ({ label: r.title, value: `${r.cart_adds} adds` }))} />
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-card border-2 border-border/50 rounded-3xl p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 italic">Infrastructure Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <SettingInput label="SMTP HOST" value={settings.SMTP_HOST} onChange={v => setSettings({...settings, SMTP_HOST: v})} />
            <SettingInput label="SMTP PORT" value={settings.SMTP_PORT} onChange={v => setSettings({...settings, SMTP_PORT: v})} />
            <SettingInput label="SMTP USER" value={settings.SMTP_USER} onChange={v => setSettings({...settings, SMTP_USER: v})} />
            <SettingInput label="SMTP PASS" value={settings.SMTP_PASS} type="password" onChange={v => setSettings({...settings, SMTP_PASS: v})} />
            <SettingInput label="SMTP FROM" value={settings.SMTP_FROM} onChange={v => setSettings({...settings, SMTP_FROM: v})} />
          </div>
          <button onClick={handleSaveSettings} className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-3">
            <Save className="h-5 w-5" /> Synchronize Environment
          </button>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-card border-2 border-border/50 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b bg-muted/30 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Identity Management</h2>
            <button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20">Provision User</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">
                <tr><th className="px-8 py-6">Email</th><th className="px-8 py-6">Role</th><th className="px-8 py-6 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-8 py-6 font-bold">{u.email}</td>
                    <td className="px-8 py-6"><span className="text-[10px] font-black uppercase bg-muted px-3 py-1 rounded-lg">{u.role}</span></td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => { setEditingUser(u); setUserFormData({ email: u.email, password: '', role: u.role }); }} className="p-2 hover:text-primary"><Key className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-card border-2 border-border/50 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b bg-muted/30">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-foreground">Operational Audit Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">
                <tr><th className="px-8 py-6">Timestamp</th><th className="px-8 py-6">Actor</th><th className="px-8 py-6">Action</th><th className="px-8 py-6">Details</th></tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {logs.map(l => (
                  <tr key={l.id} className="text-sm border-b hover:bg-muted/20">
                    <td className="px-8 py-4 opacity-60 font-mono text-[10px]">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="px-8 py-4 font-bold">{l.user_email}</td>
                    <td className="px-8 py-4"><span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded-lg">{l.action}</span></td>
                    <td className="px-8 py-4 opacity-80 max-w-xs truncate">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      {(isCreateModalOpen || editingUser) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border-4 border-primary/20 rounded-[2.5rem] shadow-2xl p-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 italic">{editingUser ? 'Update Identity' : 'Provision User'}</h2>
            <form onSubmit={handleSaveUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                <input required className="w-full h-14 bg-muted/30 border-2 border-border/50 rounded-2xl px-5 font-black focus:border-primary outline-none" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                <input required={!editingUser} type="password" placeholder={editingUser ? "Leave blank to keep" : "••••••••"} className="w-full h-14 bg-muted/30 border-2 border-border/50 rounded-2xl px-5 font-black focus:border-primary outline-none" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-5 bg-primary text-primary-foreground rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl">Synchronize</button>
              <button onClick={() => { setEditingUser(null); setIsCreateModalOpen(false); }} className="w-full text-xs font-black uppercase tracking-widest text-muted-foreground">Cancel Operation</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingInput({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{label}</label>
      <input type={type} className="w-full h-14 bg-muted/30 border-2 border-border/50 rounded-2xl px-5 font-black focus:border-primary outline-none transition-all shadow-inner" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-card border-2 border-border/50 rounded-[2rem] p-8 shadow-xl shadow-primary/5 relative overflow-hidden group">
      <div className={`h-14 w-14 ${color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl transition-transform group-hover:scale-110 z-10 relative`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'h-7 w-7' })}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2 relative z-10">{label}</p>
      <p className="text-4xl font-black tracking-tighter text-foreground relative z-10">{value}</p>
    </div>
  );
}

function MetricList({ title, items }: { title: string, items: { label: string, value: string }[] }) {
  return (
    <div className="bg-card border-2 border-border/50 rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5">
      <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-primary/10 pb-6 italic">{title}</h3>
      <div className="space-y-5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-5 bg-muted/20 rounded-[1.5rem] border-2 border-transparent hover:border-primary/10 transition-all cursor-default">
            <span className="font-black text-sm text-foreground line-clamp-1">{item.label}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 border border-primary/10 px-4 py-2 rounded-xl whitespace-nowrap">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
