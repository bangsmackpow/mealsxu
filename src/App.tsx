import { useState, useEffect } from 'react'
import { Search, ShoppingCart, User, Plus, ExternalLink } from 'lucide-react'
import { RecipeForm } from './components/RecipeForm'

const DIETARY_TAGS = [
  'Keto', 'Low Salt', 'Mediterranean', 'Gluten-Free', 
  'Hotdish Friendly', 'Low Carb', 'Diabetic Friendly',
  'Dairy Free', 'Vegetarian', 'High Protein'
]

interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url: string;
  source_name?: string;
  source_url?: string;
}

function App() {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecipes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recipes')
      const data = await response.json()
      setRecipes(data)
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
  }, [])

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
            <button 
              onClick={() => setShowForm(true)}
              className="p-2 hover:bg-accent rounded-full"
            >
              <Plus className="h-5 w-5" />
            </button>
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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map(recipe => (
              <div key={recipe.id} className="group rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-muted relative">
                  <img 
                    src={recipe.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop'} 
                    alt={recipe.title} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg leading-tight line-clamp-1">{recipe.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {recipe.description || 'A delicious hearty meal perfect for any night.'}
                  </p>
                  
                  {recipe.source_name && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider mb-4">
                      <span>Source: {recipe.source_name}</span>
                      {recipe.source_url && (
                        <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                          <ExternalLink className="h-2 w-2" />
                        </a>
                      )}
                    </div>
                  )}

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
        )}
      </main>

      {/* Recipe Form Modal */}
      {showForm && (
        <RecipeForm 
          onClose={() => setShowForm(false)} 
          onSuccess={fetchRecipes}
        />
      )}
    </div>
  )
}

export default App
