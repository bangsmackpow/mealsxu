import { useState } from 'react'
import { Search, ShoppingCart, User, Plus } from 'lucide-react'

const DIETARY_TAGS = [
  'Keto', 'Low Salt', 'Mediterranean', 'Gluten-Free', 
  'Hotdish Friendly', 'Low Carb', 'Diabetic Friendly'
]

function App() {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-primary">Mealsxu</h1>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium hover:text-primary">Recipes</a>
              <a href="#" className="text-sm font-medium hover:text-primary">Meal Plans</a>
              <a href="#" className="text-sm font-medium hover:text-primary">Bulk Orders</a>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="search" 
                placeholder="Search recipes..." 
                className="pl-9 h-10 w-[200px] lg:w-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button className="p-2 hover:bg-accent rounded-full"><Plus className="h-5 w-5" /></button>
            <button className="p-2 hover:bg-accent rounded-full"><ShoppingCart className="h-5 w-5" /></button>
            <button className="p-2 hover:bg-accent rounded-full"><User className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {DIETARY_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTag === tag 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="group rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-muted relative">
                <img 
                  src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop`} 
                  alt="Recipe" 
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg leading-tight">Midwest Comfort Hotdish</h3>
                  <span className="text-xs font-medium bg-secondary px-2 py-0.5 rounded">Low Salt</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  A classic hearty meal perfect for cold nights. Bulk-friendly and family approved.
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="text-sm">
                    <span className="font-bold text-primary">$2.45</span>
                    <span className="text-muted-foreground"> / meal</span>
                  </div>
                  <button className="text-xs font-semibold text-primary hover:underline">View Recipe</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
