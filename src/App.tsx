import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Search, ShoppingCart, User, Plus, ExternalLink, ArrowRight } from 'lucide-react'
import { RecipeForm } from './components/RecipeForm'
import { RecipeDetail } from './components/RecipeDetail'
import { Layout } from './components/Layout'
import { Admin } from './pages/Admin'
import { MealPlans } from './pages/MealPlans'

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

const FOOD_IMAGES = [
  'photo-1546069901-ba9599a7e63c',
  'photo-1567620905732-2d1ec7bb7445',
  'photo-1565299624946-b28f40a0ae38',
  'photo-1482049016688-2d3e1b311543',
  'photo-1484723088339-0b2830a711d2',
  'photo-1473093226795-af9932fe5856',
  'photo-1512621776951-a57141f2eefd',
  'photo-1540189549336-e6e99c3679fe',
  'photo-1565958011703-44f9829ba187',
  'photo-1467003909585-2f8a72700288',
];

function Home() {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)

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
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-12 shadow-2xl shadow-primary/20 border-b-8 border-primary-foreground/10">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-5xl font-black mb-4 tracking-tighter leading-none">Grocery Shopping, <br/>Simplified by Recipes.</h2>
          <p className="text-lg font-medium opacity-90 mb-8 max-w-md leading-relaxed">
            Choose from hundreds of Midwest-inspired meals. We map the ingredients directly to your Walmart cart.
          </p>
          <div className="flex gap-4">
            <button className="bg-white text-primary px-8 py-3 rounded-xl font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg active:scale-95">
              Browse All
            </button>
            <button className="bg-primary-foreground/10 backdrop-blur-sm text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-foreground/20 transition-all border border-white/20">
              Learn More
            </button>
          </div>
        </div>
        <div className="absolute right-[-10%] top-[-20%] w-[60%] h-[140%] bg-white/10 blur-3xl rounded-full rotate-12"></div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Filter By:</span>
        {DIETARY_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border-2 whitespace-nowrap ${
              activeTag === tag 
                ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                : 'bg-card border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Recipe Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {recipes.map(recipe => {
            // Deterministic random image from our high-quality set
            const imageIndex = Math.abs(recipe.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % FOOD_IMAGES.length;
            const displayImage = recipe.image_url.includes('photo-1500000000000') 
              ? `https://images.unsplash.com/${FOOD_IMAGES[imageIndex]}?w=600&h=450&fit=crop` 
              : recipe.image_url;

            return (
              <div 
                key={recipe.id} 
                onClick={() => setSelectedRecipeId(recipe.id)}
                className="group cursor-pointer bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all hover:scale-[1.02] active:scale-95 flex flex-col h-full"
              >
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  <img 
                    src={displayImage} 
                    alt={recipe.title} 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                      Featured
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-3 flex flex-col flex-1">
                  <h3 className="font-black text-xl leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">{recipe.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                    {recipe.description || 'A delicious hearty meal perfect for cold nights. Bulk-friendly and family approved.'}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2 border-t mt-auto">
                    <div className="text-sm">
                      <span className="font-black text-primary text-lg">$2.45</span>
                      <span className="text-muted-foreground font-bold italic"> / meal</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-black text-xs uppercase tracking-tighter group-hover:gap-2 transition-all">
                      View <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRecipeId && (
        <RecipeDetail 
          recipeId={selectedRecipeId} 
          onClose={() => setSelectedRecipeId(null)} 
        />
      )}
    </div>
  )
}

function App() {
  const [showForm, setShowForm] = useState(false)

  return (
    <Router>
      <Layout onAddRecipe={() => setShowForm(true)}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/meal-plans" element={<MealPlans />} />
          {/* Add more routes as needed */}
        </Routes>
      </Layout>

      {/* Recipe Form Modal */}
      {showForm && (
        <RecipeForm 
          onClose={() => setShowForm(false)} 
          onSuccess={() => window.location.reload()} // Quick refresh for now
        />
      )}
    </Router>
  )
}

export default App
