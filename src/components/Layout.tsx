import React from 'react';
import { Search, ShoppingCart, User, Plus, Home, Calendar, LayoutDashboard, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  onAddRecipe: () => void;
}

export function Layout({ children, onAddRecipe }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error('Layout: Failed to parse user data', e);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-primary tracking-tighter uppercase italic">Mealsxu</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/" 
                className={`text-xs font-black uppercase tracking-widest transition-colors hover:text-primary flex items-center gap-1.5 ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Home className="h-3 w-3" /> Recipes
              </Link>
              <Link 
                to="/meal-plans" 
                className={`text-xs font-black uppercase tracking-widest transition-colors hover:text-primary flex items-center gap-1.5 ${location.pathname === '/meal-plans' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Calendar className="h-3 w-3" /> Meal Plans
              </Link>
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className={`text-xs font-black uppercase tracking-widest transition-colors hover:text-primary flex items-center gap-1.5 ${location.pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <LayoutDashboard className="h-3 w-3" /> Admin
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="search" 
                placeholder="Find a recipe..." 
                className="pl-10 h-10 w-[200px] lg:w-[300px] rounded-xl border-2 border-border/50 bg-background px-3 py-2 text-sm focus:border-primary/50 outline-none transition-all font-bold"
              />
            </div>
            
            <button 
              onClick={onAddRecipe}
              className="p-2.5 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition-all border-2 border-transparent hover:border-primary/20"
              title="Add Recipe"
            >
              <Plus className="h-5 w-5 font-black" />
            </button>
            
            <Link to="/cart" className="p-2.5 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition-all border-2 border-transparent hover:border-primary/20">
              <ShoppingCart className="h-5 w-5 font-black" />
            </Link>
            
            {user ? (
              <button 
                onClick={handleLogout}
                className="p-2.5 hover:bg-red-50 rounded-xl text-muted-foreground hover:text-red-600 transition-all border-2 border-transparent hover:border-red-100"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5 font-black" />
              </button>
            ) : (
              <Link to="/login" className="p-2.5 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition-all border-2 border-transparent hover:border-primary/20">
                <User className="h-5 w-5 font-black" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      <footer className="border-t py-8 mt-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            &copy; 2026 MEALSXU. BOLDLY BUILT FOR THE MIDWEST.
          </p>
        </div>
      </footer>
    </div>
  );
}
