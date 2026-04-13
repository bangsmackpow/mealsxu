import React from 'react';
import { Search, ShoppingCart, User, Plus, Home, Calendar, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  onAddRecipe: () => void;
}

export function Layout({ children, onAddRecipe }: LayoutProps) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-primary tracking-tighter">Mealsxu</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Home className="h-4 w-4" /> Recipes
              </Link>
              <Link 
                to="/meal-plans" 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${location.pathname === '/meal-plans' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Calendar className="h-4 w-4" /> Meal Plans
              </Link>
              <Link 
                to="/admin" 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${location.pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <LayoutDashboard className="h-4 w-4" /> Admin
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="search" 
                placeholder="Search recipes..." 
                className="pl-9 h-10 w-[200px] lg:w-[300px] rounded-full border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              />
            </div>
            
            <button 
              onClick={onAddRecipe}
              className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-primary transition-colors"
              title="Add Recipe"
            >
              <Plus className="h-5 w-5" />
            </button>
            
            <Link to="/cart" className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-primary transition-colors">
              <ShoppingCart className="h-5 w-5" />
            </Link>
            
            <Link to="/profile" className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-primary transition-colors">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100-4rem)]">
        {children}
      </main>

      <footer className="border-t py-8 mt-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 Mealsxu. Built for the Midwest.
          </p>
        </div>
      </footer>
    </div>
  );
}
