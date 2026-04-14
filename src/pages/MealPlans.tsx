import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronRight, ShoppingCart, Trash2, Clock, Search, X, Utensils, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlannedMeal {
  planned_meal_id: string;
  recipe_id: string;
  title: string;
  day_of_week: string;
  image_url: string;
}

interface GroceryIngredient {
  name: string;
  quantity: number;
  unit: string;
}

interface RecipeOption {
  id: string;
  title: string;
  image_url: string;
}

export function MealPlans() {
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryIngredient[]>([]);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectedDay, setSelectedRecipeDay] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const [planRes, recipesRes, groceryRes] = await Promise.all([
        fetch('/api/user/meal-plans/current', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/recipes'),
        fetch('/api/user/meal-plans/current/grocery-list', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (planRes.ok) {
        const data = await planRes.json();
        setPlannedMeals(data.meals);
      }
      if (recipesRes.ok) {
        setRecipes(await recipesRes.json());
      }
      if (groceryRes.ok) {
        setGroceryList(await groceryRes.json());
      }
    } catch (e) {
      console.error('Failed to fetch meal plan data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRecipe = async (recipeId: string) => {
    if (!selectedDay) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/user/meal-plans', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipeId, dayOfWeek: selectedDay })
      });
      if (res.ok) {
        setIsSelectorOpen(false);
        fetchData(); // Refresh
      }
    } catch (e) { console.error(e); }
  };

  const handleRemoveMeal = async (mealId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/user/meal-plans/meals/${mealId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleExportToWalmart = async () => {
    if (groceryList.length === 0) return;
    setExporting(true);
    const token = localStorage.getItem('token');
    
    try {
      // 1. Map ingredients to items
      const mapRes = await fetch('/api/walmart/map-ingredients', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ingredients: groceryList, zipCode: '50309' })
      });

      if (!mapRes.ok) throw new Error('Mapping failed');
      const mappedData = await mapRes.json();

      // 2. Create bundle and redirect
      // For this scaffold, we'll assume mappedData returns a list of items
      // In a real scenario, you'd let the user review the items first.
      const bundleRes = await fetch('/api/walmart/create-bundle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          items: mappedData.items || [], 
          recipeIds: plannedMeals.map(m => m.recipe_id) 
        })
      });

      if (bundleRes.ok) {
        const { url } = await bundleRes.json();
        window.open(url, '_blank');
      }
    } catch (e) {
      console.error(e);
      alert('Walmart Integration is currently unavailable. Check back soon!');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-primary animate-pulse italic uppercase tracking-widest">Synchronizing Weekly Schedule...</div>;

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
      <header className="mb-12 flex flex-col lg:row md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-foreground uppercase italic border-l-8 border-primary pl-6 leading-none">Weekly Strategy</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Optimize your nutrition and logistics for the week ahead.</p>
        </div>
        <div className="bg-card border-4 border-primary/10 p-6 rounded-[2rem] flex items-center gap-8 shadow-2xl shadow-primary/5 relative overflow-hidden group hover:border-primary/30 transition-all">
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Provisioning Cost</p>
            <p className="text-3xl font-black text-primary italic">~${(plannedMeals.length * 3.45).toFixed(2)}</p>
          </div>
          <button 
            onClick={handleExportToWalmart}
            disabled={exporting || groceryList.length === 0}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 relative z-10 italic text-xs disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export to Walmart'}
          </button>
          <Utensils className="absolute right-[-10px] bottom-[-10px] h-24 w-24 text-primary/[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Planner Grid */}
        <div className="lg:col-span-2 space-y-4">
          {days.map((day) => {
            const mealsForDay = plannedMeals.filter(m => m.day_of_week === day);
            return (
              <div key={day} className={`group p-6 rounded-[1.5rem] border-2 transition-all ${mealsForDay.length > 0 ? 'bg-card border-primary/10 shadow-xl shadow-primary/5' : 'bg-muted/20 border-dashed border-border/50 hover:bg-muted/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest ${mealsForDay.length > 0 ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground border-2 border-border/50'}`}>
                      {day.substring(0, 3)}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-lg uppercase tracking-tight text-foreground">{day}</h3>
                      {mealsForDay.length > 0 ? (
                        <div className="space-y-2">
                          {mealsForDay.map(m => (
                            <div key={m.planned_meal_id} className="flex items-center gap-3 text-sm text-muted-foreground font-bold hover:text-primary transition-colors cursor-default">
                              <div className="h-6 w-6 rounded-md bg-muted overflow-hidden border border-border/50">
                                <img src={`/api/proxy-image?url=${encodeURIComponent(m.image_url)}`} alt="" className="h-full w-full object-cover" />
                              </div>
                              <span className="line-clamp-1 italic">{m.title}</span>
                              <button 
                                onClick={() => handleRemoveMeal(m.planned_meal_id)}
                                className="p-1 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-md transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic font-medium uppercase tracking-widest opacity-40">No operations planned</p>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { setSelectedRecipeDay(day); setIsSelectorOpen(true); }}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2.5 rounded-xl transition-all ${mealsForDay.length > 0 ? 'text-primary hover:bg-primary/5 border border-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5 border border-border/50'}`}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar: Grocery List & Intelligence */}
        <div className="space-y-8">
          <div className="bg-card border-2 border-border/50 rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5 relative overflow-hidden">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 italic">
              <ListChecks className="h-6 w-6 text-primary" />
              Grocery Payload
            </h3>
            
            <div className="space-y-4 relative z-10">
              {groceryList.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-2">
                    {groceryList.map((ing, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 hover:border-primary/20 transition-all group">
                        <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors capitalize">{ing.name}</span>
                        <span className="text-[10px] font-black text-muted-foreground bg-white px-2 py-1 rounded-lg border shadow-sm whitespace-nowrap">
                          {ing.quantity.toFixed(1)} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 border-t-2 border-border/20 flex items-center justify-between opacity-60 italic">
                    <span className="text-[10px] font-black uppercase tracking-widest">Aggregated Units</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{groceryList.length} Items</span>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center space-y-4 opacity-30">
                  <ShoppingCart className="h-12 w-12 mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Plan Input</p>
                </div>
              )}
            </div>
            <Utensils className="absolute right-[-20px] top-[-20px] h-40 w-40 text-primary/[0.02] -rotate-12" />
          </div>

          <div className="bg-primary text-primary-foreground rounded-[2rem] p-10 shadow-2xl shadow-primary/20 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-black text-2xl uppercase tracking-tighter mb-2 italic">Logistics Intel</h3>
              <p className="text-sm opacity-90 mb-8 font-medium leading-relaxed">
                Bulk procurement optimization will save you approximately <span className="underline decoration-4 underline-offset-4 decoration-white/30">$4.20</span> this cycle.
              </p>
              <button className="w-full bg-white text-primary py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl italic">
                Optimize Logistics
              </button>
            </div>
            <div className="absolute right-[-10%] bottom-[-10%] w-40 h-40 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
          </div>
        </div>
      </div>

      {/* Recipe Selector Modal */}
      {isSelectorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl border-4 border-primary/20 rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <header className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">Select Protocol</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Planning for {selectedDay}</p>
              </div>
              <button onClick={() => setIsSelectorOpen(false)} className="p-3 hover:bg-muted rounded-2xl transition-colors text-muted-foreground"><X /></button>
            </header>

            <div className="relative mb-8">
              <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
              <input 
                autoFocus
                placeholder="Search Recipe intelligence..." 
                className="w-full h-14 bg-muted/30 border-2 border-border/50 rounded-2xl pl-12 pr-5 font-black focus:border-primary outline-none transition-all shadow-inner"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
              {recipes.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).map(recipe => (
                <button 
                  key={recipe.id}
                  onClick={() => handleAddRecipe(recipe.id)}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                >
                  <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden border border-border/50 shrink-0">
                    <img src={`/api/proxy-image?url=${encodeURIComponent(recipe.image_url)}`} alt="" className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                  <span className="font-black text-sm text-foreground line-clamp-1 uppercase italic">{recipe.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
