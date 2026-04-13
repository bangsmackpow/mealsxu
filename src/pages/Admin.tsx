import React, { useState, useEffect } from 'react';
import { Users, BookOpen, BarChart3, Shield, Search, MoreVertical, Archive, Key, Trash2 } from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'recipes'>('dashboard');

  const metrics: Metric[] = [
    { label: 'Total Users', value: 124, icon: <Users className="h-5 w-5" />, trend: '+12% this month' },
    { label: 'Total Recipes', value: 504, icon: <BookOpen className="h-5 w-5" />, trend: '+500 this week' },
    { label: 'Cart Conversions', value: '18%', icon: <BarChart3 className="h-5 w-5" />, trend: '+3% from last week' },
    { label: 'Active Admins', value: 2, icon: <Shield className="h-5 w-5" /> },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, recipes, and track platform metrics.</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b mb-8 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-[2px] ${activeTab === 'dashboard' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-[2px] ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          User Management
        </button>
        <button 
          onClick={() => setActiveTab('recipes')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-[2px] ${activeTab === 'recipes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Recipe Moderation
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m, i) => (
              <div key={i} className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    {m.icon}
                  </div>
                  {m.trend && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{m.trend}</span>}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border rounded-xl p-6 h-80 flex flex-col items-center justify-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">User Activity (Chart Placeholder)</p>
            </div>
            <div className="bg-card border rounded-xl p-6 h-80 flex flex-col items-center justify-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">Dietary Tag Popularity (Chart Placeholder)</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-card border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                placeholder="Search by email..." 
                className="pl-9 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <button className="text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90">
              Create New User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user.email[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.created_at}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground" title="Reset Password"><Key className="h-4 w-4" /></button>
                        <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground" title="Archive User"><Archive className="h-4 w-4" /></button>
                        <button className="p-2 hover:bg-red-50 rounded-md text-muted-foreground hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
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
        <div className="text-center py-20 text-muted-foreground bg-card border rounded-xl">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg">Recipe Moderation Queue</p>
          <p className="text-sm">Currently no recipes pending review.</p>
        </div>
      )}
    </div>
  );
}
