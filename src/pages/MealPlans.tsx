import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronRight, ShoppingCart, Trash2, Clock } from 'lucide-react';

interface PlannedMeal {
  id: string;
  recipeTitle: string;
  day: string;
  price: number;
}

export function MealPlans() {
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([
    { id: '1', recipeTitle: 'Midwest Comfort Hotdish', day: 'Monday', price: 2.45 },
    { id: '2', recipeTitle: 'Balsamic Turkey Breast', day: 'Tuesday', price: 3.10 },
  ]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const totalPrice = plannedMeals.reduce((acc, meal) => acc + meal.price, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Weekly Meal Planner</h1>
          <p className="text-muted-foreground font-medium">Build your grocery cart by planning your week.</p>
        </div>
        <div className="bg-primary/5 border-2 border-primary/20 p-4 rounded-2xl flex items-center gap-6 shadow-sm">
          <div className="space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estimated Total</p>
            <p className="text-2xl font-black text-primary">${totalPrice.toFixed(2)}</p>
          </div>
          <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Export to Walmart
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Planner Grid */}
        <div className="lg:col-span-2 space-y-4">
          {days.map((day) => {
            const meal = plannedMeals.find(m => m.day === day);
            return (
              <div key={day} className={`group p-4 rounded-xl border-2 transition-all ${meal ? 'bg-card border-primary/10 shadow-sm' : 'bg-muted/30 border-dashed border-muted-foreground/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-xs ${meal ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {day.substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{day}</h3>
                      {meal ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                          <Clock className="h-3 w-3" /> {meal.recipeTitle}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No meal planned</p>
                      )}
                    </div>
                  </div>
                  
                  {meal ? (
                    <div className="flex items-center gap-4">
                      <p className="font-black text-primary">${meal.price.toFixed(2)}</p>
                      <button className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-all">
                      <Plus className="h-4 w-4" /> Add Recipe
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar: Quick Add / Suggestions */}
        <div className="space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Quick Suggestions
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors border border-transparent hover:border-border">
                  <div className="h-12 w-12 rounded-md bg-muted overflow-hidden">
                    <img src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100`} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">Hearty Midwest Hotdish</p>
                    <p className="text-xs text-muted-foreground font-medium">$2.10 per meal</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-xl shadow-primary/10">
            <h3 className="font-black text-xl mb-2">Bulk Savings</h3>
            <p className="text-sm opacity-90 mb-4 font-medium leading-relaxed">
              Based on your current plan, buying ingredients in bulk would save you <span className="underline decoration-2 underline-offset-2">$4.20</span> this week.
            </p>
            <button className="w-full bg-white text-primary py-3 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-opacity-90 transition-all shadow-md">
              Optimize Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
