import React, { useEffect, useState } from 'react';
import { X, ShoppingCart, Calendar, Clock, Users, ExternalLink, Printer } from 'lucide-react';

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

  if (loading) return null; // Or a smaller loader inside the modal
  if (!recipe) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-4xl border rounded-2xl shadow-2xl relative my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 bg-background/50 hover:bg-background border rounded-full transition-all z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Image & Info */}
          <div className="relative">
            <img 
              src={recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'} 
              alt={recipe.title} 
              className="w-full h-full object-cover min-h-[300px] md:min-h-[500px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-end items-end p-6">
              <div className="text-white">
                <div className="flex flex-wrap gap-2 mb-3">
                  {recipe.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wider bg-primary px-2 py-0.5 rounded shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-3xl font-bold leading-tight">{recipe.title}</h2>
              </div>
            </div>
          </div>

          {/* Right: Ingredients & Details */}
          <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground border-b pb-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>{recipe.servings} Servings</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>35 mins</span>
              </div>
              <button className="flex items-center gap-2 hover:text-primary transition-colors ml-auto">
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
            </div>

            <section className="space-y-4">
              <h3 className="font-bold text-xl flex items-center gap-2">
                Ingredients
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {recipe.ingredients.length} items
                </span>
              </h3>
              <ul className="grid grid-cols-1 gap-3">
                {recipe.ingredients.map(ing => (
                  <li key={ing.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/20 transition-colors">
                    <span className="font-medium">{ing.name}</span>
                    <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded border">
                      {ing.quantity} {ing.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="font-bold text-xl">Instructions</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {recipe.instructions}
              </p>
            </section>

            {recipe.source_name && (
              <div className="pt-6 border-t flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Source: <span className="font-bold text-foreground">{recipe.source_name}</span></span>
                  {recipe.source_url && (
                    <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="p-1 hover:text-primary transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95">
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>
              <button className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-4 rounded-xl font-bold hover:bg-secondary/80 transition-all border active:scale-95">
                <Calendar className="h-5 w-5" />
                Plan Meal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
