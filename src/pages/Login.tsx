import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        const errData = await response.json();
        setError(errData.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <div className="bg-card w-full max-w-md border-2 border-border/50 rounded-3xl shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-300">
        <header className="text-center mb-10">
          <div className="h-16 w-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 rotate-3">
            <Lock className="h-8 w-8 font-black" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Welcome Back</h1>
          <p className="text-muted-foreground font-medium">Log in to manage your Mealsxu account.</p>
        </header>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 text-red-600 p-4 rounded-xl mb-8 flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <input 
                required
                type="email"
                placeholder="admin@mealsxu.com"
                className="w-full h-12 bg-background border-2 border-border/50 rounded-xl pl-12 pr-4 font-bold focus:border-primary outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <input 
                required
                type="password"
                placeholder="••••••••"
                className="w-full h-12 bg-background border-2 border-border/50 rounded-xl pl-12 pr-4 font-bold focus:border-primary outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 mt-4 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <footer className="mt-10 pt-8 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            Don't have an account? <span className="text-primary font-black hover:underline cursor-pointer">Register</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
