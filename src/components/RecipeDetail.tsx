import React, { useEffect, useState } from 'react';
import { 
  X, ShoppingCart, Calendar, Clock, Users, ExternalLink, Printer, Utensils, 
  AlertTriangle, CheckCircle, Edit3, Save, Facebook, Instagram, Twitter, Share2 
} from 'lucide-react';

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
  user_id: string;
  ingredients: Ingredient[];
  tags: string[];
}

export function RecipeDetail({ recipeId, onClose }: RecipeDetailProps) {
  const [recipe, setRecipe] = useState<RecipeFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [plannedDay, setPlannedDay] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditFormData] = useState({ title: '', description: '', instructions: '' });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = currentUser.role === 'admin' || currentUser.id === recipe?.user_id;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handlePlanMeal = async (day: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/user/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipeId, dayOfWeek: day })
      });
      if (res.ok) {
        setPlannedDay(day);
        setTimeout(() => setPlannedDay(null), 3000);
        setIsPlanning(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateRecipe = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editData)
      });
      if (res.ok) {
        setIsEditing(false);
        fetchRecipe();
      }
    } catch (e) { console.error(e); }
  };

  const handlePrint = () => { window.print(); };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this recipe for ${recipe?.title} on Mealsxu!`;
    let shareUrl = '';
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      const data = await response.json();
      setRecipe(data);
      setEditFormData({ title: data.title, description: data.description, instructions: data.instructions });
    } catch (error) {
      console.error('Error fetching recipe detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecipe(); }, [recipeId]);

  if (loading) return null;
  if (!recipe) return null;

  const displayImage = recipe.image_url?.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(recipe.image_url)}` : recipe.image_url;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Hidden Printable Area */}
      <div id="printable-recipe" className="hidden">
        <div className="print-col-left">
          <h2 className="italic tracking-tighter uppercase" style={{ color: '#f97316' }}>Mealsxu</h2>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest mb-6 opacity-60">
            <span>{recipe.servings} Servings</span>
            <span>35 Mins Prep</span>
          </div>
          <img src={displayImage} alt="" className="rounded-2xl" />
          <h2 className="text-3xl font-black mb-4">{recipe.title}</h2>
          <h3 className="font-bold text-xl uppercase border-b-2 border-black pb-2 mt-8">Ingredients</h3>
          <ul className="space-y-2 mt-4">
            {recipe.ingredients.map(ing => (
              <li key={ing.id} className="flex justify-between border-b pb-1 border-gray-100">
                <span className="font-bold">{ing.name}</span>
                <span className="opacity-60">{ing.quantity} {ing.unit}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="print-col-right">
          <h3 className="font-bold text-xl uppercase border-b-2 border-black pb-2">Kitchen Instructions</h3>
          <div className="space-y-4 mt-6">
            {recipe.instructions.split('\n').filter(line => line.trim()).map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <span className="font-black opacity-30">{idx + 1}.</span>
                <p className="font-medium leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Original Source</p>
            <p className="text-sm font-black">{recipe.source_name || 'Mealsxu Culinary Partner'}</p>
            <p className="text-[10px] break-all opacity-60 mt-1">{recipe.source_url}</p>
          </div>
        </div>
      </div>

      <div className="bg-card w-full max-w-5xl border-2 border-border/50 rounded-3xl shadow-2xl relative my-8 overflow-hidden animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute right-6 top-6 p-2 bg-white/80 hover:bg-white text-foreground border-2 border-border/20 rounded-xl transition-all z-20 shadow-sm no-print">
          <X className="h-6 w-6 font-black" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
          {/* Left: Image & Info */}
          <div className="lg:col-span-2 relative min-h-[400px] lg:min-h-0 bg-muted">
            {!imageError ? (
              <img src={displayImage} alt={recipe.title} className="w-full h-full object-cover" onError={() => setImageError(true)} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center bg-muted/50">
                <Utensils className="h-20 w-20 mb-4 opacity-10" />
                <p className="text-xs font-black uppercase tracking-widest opacity-40 leading-relaxed">Original Dish Photo<br/>Currently Unavailable</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground px-3 py-1 rounded-lg shadow-xl">
                    {tag}
                  </span>
                ))}
              </div>
              {isEditing ? (
                <input className="text-2xl font-black bg-white/20 text-white rounded p-2 outline-none border border-white/40 mb-2" value={editData.title} onChange={e => setEditFormData({...editData, title: e.target.value})} />
              ) : (
                <h2 className="text-4xl font-black text-white leading-none tracking-tighter mb-2">{recipe.title}</h2>
              )}
              {isEditing ? (
                <textarea className="text-sm font-medium bg-white/20 text-white rounded p-2 outline-none border border-white/40 w-full" value={editData.description} onChange={e => setEditFormData({...editData, description: e.target.value})} />
              ) : (
                <p className="text-white/80 text-sm font-medium line-clamp-3 italic border-l-4 border-primary pl-4 py-1">"{recipe.description}"</p>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-3 p-8 lg:p-12 space-y-10 max-h-[85vh] overflow-y-auto bg-card custom-scrollbar">
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b-2 border-border/30 pb-8 no-print">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>{recipe.servings} Servings</span>
              </div>
              <button onClick={handlePrint} className="flex items-center gap-2 hover:text-primary transition-colors ml-auto group">
                <Printer className="h-4 w-4 group-hover:scale-110" />
                <span>Print Card</span>
              </button>
              {canEdit && (
                <button onClick={() => isEditing ? handleUpdateRecipe() : setIsEditing(true)} className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                  {isEditing ? <><Save className="h-4 w-4" /> Save</> : <><Edit3 className="h-4 w-4" /> Edit</>}
                </button>
              )}
            </div>

            <section className="space-y-6">
              <h3 className="font-black text-2xl uppercase tracking-tighter">The Grocery List</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recipe.ingredients.map(ing => (
                  <div key={ing.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border-2 border-transparent">
                    <span className="font-bold text-sm capitalize">{ing.name}</span>
                    <span className="text-[10px] font-black text-muted-foreground bg-white px-2 py-1 rounded-lg border">{ing.quantity} {ing.unit}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="font-black text-2xl uppercase tracking-tighter">Kitchen Instructions</h3>
              {isEditing ? (
                <textarea className="w-full h-64 p-4 rounded-2xl bg-muted/30 border-2 border-border/50 font-medium focus:border-primary outline-none" value={editData.instructions} onChange={e => setEditFormData({...editData, instructions: e.target.value})} />
              ) : (
                <div className="space-y-4">
                  {recipe.instructions.split('\n').filter(line => line.trim()).map((step, idx) => (
                    <div key={idx} className="flex gap-6 group">
                      <span className="h-8 w-8 shrink-0 rounded-xl bg-muted flex items-center justify-center font-black text-xs text-muted-foreground">{idx + 1}</span>
                      <p className="text-muted-foreground leading-relaxed font-medium pt-1">{step.replace(/^\d+\.\s*/, '')}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Social Share */}
            <section className="pt-8 border-t-2 border-border/30 no-print">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Share Protocol</span>
                <div className="flex gap-3">
                  <button onClick={() => handleShare('facebook')} className="p-3 bg-blue-600 text-white rounded-xl hover:scale-110 transition-all"><Facebook className="h-4 w-4" /></button>
                  <button onClick={() => handleShare('twitter')} className="p-3 bg-sky-500 text-white rounded-xl hover:scale-110 transition-all"><Twitter className="h-4 w-4" /></button>
                  <button onClick={() => handleShare('instagram')} className="p-3 bg-pink-600 text-white rounded-xl hover:scale-110 transition-all"><Instagram className="h-4 w-4" /></button>
                </div>
              </div>
            </section>

            {/* Attribution */}
            <section className="pt-10 border-t-4 border-muted/50 no-print">
              <div className="bg-muted/30 rounded-3xl p-8 border-2 border-border/50 relative overflow-hidden">
                <p className="text-sm font-medium text-muted-foreground mb-6 leading-relaxed relative z-10">
                  Sourced from <span className="text-foreground font-black underline decoration-primary/30 underline-offset-4">{recipe.source_name}</span>.
                </p>
                <div className="flex flex-wrap gap-4 relative z-10">
                  <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-3 bg-foreground text-background py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">View Original <ExternalLink className="h-4 w-4" /></a>
                  <button className="flex-1 flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl italic">Add to Cart</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
