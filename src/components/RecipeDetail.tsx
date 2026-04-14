import React, { useEffect, useState } from 'react';
import { X, ShoppingCart, Calendar, Clock, Users, ExternalLink, Printer, Utensils, AlertTriangle } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface RecipeDetailProps {
  recipeId: string;
  onClose: () => void;
}

interface RecipeFull {
  id: string;
  title: string;
  description: string;
  instructions: string;
  image_url: string;
  servings: number;
  source_name?: string;
  source_url?: string;
  ingredients: Ingredient[];
  tags: string[];
}

export function RecipeDetail({ recipeId, onClose }: RecipeDetailProps) {
  const [recipe, setRecipe] = useState<RecipeFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/recipes/${recipeId}`);
        const data = await response.json();
        setRecipe(data);
      } catch (error) {
        console.error('Error fetching recipe detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [recipeId]);

  if (loading) return null;
  if (!recipe) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-5xl border-2 border-border/50 rounded-3xl shadow-2xl relative my-8 overflow-hidden animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 bg-white/80 hover:bg-white text-foreground border-2 border-border/20 rounded-xl transition-all z-20 shadow-sm"
        >
          <X className="h-6 w-6 font-black" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
          {/* Left: Image & Info (2/5) */}
          <div className="lg:col-span-2 relative min-h-[400px] lg:min-h-0 bg-muted">
            {!imageError ? (
              <img 
                src={recipe.image_url?.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(recipe.image_url)}` : recipe.image_url} 
                alt={recipe.title} 
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center bg-muted/50">
                <Utensils className="h-20 w-20 mb-4 opacity-10" />
                <p className="text-xs font-black uppercase tracking-widest opacity-40 leading-relaxed">Original Dish Photo<br/>Currently Unavailable</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground px-3 py-1 rounded-lg shadow-xl shadow-primary/20">
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-4xl font-black text-white leading-none tracking-tighter mb-2">{recipe.title}</h2>
              <p className="text-white/80 text-sm font-medium line-clamp-3 leading-relaxed italic border-l-4 border-primary pl-4 py-1">
                "{recipe.description || 'A cherished Midwest classic brought to your table.'}"
              </p>
            </div>
          </div>

          {/* Right: Ingredients & Details (3/5) */}
          <div className="lg:col-span-3 p-8 lg:p-12 space-y-10 max-h-[85vh] overflow-y-auto bg-card custom-scrollbar">
            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b-2 border-border/30 pb-8">
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-primary" />
                <span>{recipe.servings} Servings</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-primary" />
                <span>35 Mins Prep</span>
              </div>
              <button className="flex items-center gap-2.5 hover:text-primary transition-colors ml-auto group">
                <Printer className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>Print Card</span>
              </button>
            </div>

            <section className="space-y-6">
              <h3 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
                The Grocery List
                <span className="text-[10px] font-black tracking-widest text-primary bg-primary/5 border border-primary/10 px-3 py-1 rounded-full">
                  {recipe.ingredients.length} Essentials
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recipe.ingredients.map(ing => (
                  <div key={ing.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border-2 border-transparent hover:border-primary/10 transition-all group">
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{ing.name}</span>
                    <span className="text-[10px] font-black text-muted-foreground bg-white px-2 py-1 rounded-lg border shadow-sm">
                      {ing.quantity} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="font-black text-2xl uppercase tracking-tighter">Kitchen Instructions</h3>
              <div className="space-y-4">
                {recipe.instructions.split('\n').filter(line => line.trim()).map((step, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <span className="h-8 w-8 shrink-0 rounded-xl bg-muted flex items-center justify-center font-black text-xs text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      {idx + 1}
                    </span>
                    <p className="text-muted-foreground leading-relaxed font-medium pt-1 group-hover:text-foreground transition-colors">
                      {step.replace(/^\d+\.\s*/, '')}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Liability-First Attribution Block */}
            <section className="pt-10 mt-10 border-t-4 border-muted/50">
              <div className="bg-muted/30 rounded-3xl p-8 border-2 border-border/50 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-primary mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Mandatory Attribution</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-6 leading-relaxed">
                    This recipe is sourced from <span className="text-foreground font-black underline decoration-primary/30 underline-offset-4">{recipe.source_name || 'an external culinary partner'}</span>. 
                    All rights and ownership of this content belong to the original publisher.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a 
                      href={recipe.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-foreground text-background py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-foreground/10"
                    >
                      View Original Recipe <ExternalLink className="h-4 w-4" />
                    </a>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20">
                      <ShoppingCart className="h-4 w-4" /> Add All to Cart
                    </button>
                  </div>
                </div>
                <Utensils className="absolute right-[-20px] bottom-[-20px] h-40 w-40 text-foreground/[0.03] rotate-12" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
