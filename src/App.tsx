import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Search, ShoppingCart, User, Plus, ExternalLink, ArrowRight, Utensils, AlertCircle } from 'lucide-react'
import { RecipeForm } from './components/RecipeForm'
import { RecipeDetail } from './components/RecipeDetail'
import { Layout } from './components/Layout'
import { Admin } from './pages/Admin'
import { MealPlans } from './pages/MealPlans'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { Register } from './pages/Register'

// Error Boundary Component
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-red-200 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">Application Crash</h1>
        <p className="text-muted-foreground font-medium mb-6">Something went wrong while rendering the interface.</p>
        <pre className="bg-red-50 p-4 rounded-xl text-xs font-mono text-red-800 overflow-auto max-h-40 mb-6 border border-red-100">
          {error.message}
        </pre>
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
          className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all"
        >
          Reset Application & Home
        </button>
      </div>
    </div>
  )
}

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

function Home() {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)

  const fetchRecipes = async () => {
    setLoading(true)
    try {
      const url = activeTag ? `/api/recipes?tag=${encodeURIComponent(activeTag)}` : '/api/recipes';
      const response = await fetch(url)
      const data = await response.json()
      setRecipes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching recipes:', error)
      setRecipes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
  }, [activeTag])

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
          {recipes.map(recipe => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              onClick={() => setSelectedRecipeId(recipe.id)} 
            />
          ))}
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

function RecipeCard({ recipe, onClick }: { recipe: Recipe, onClick: () => void }) {
  const [imageError, setImageError] = useState(false);
  const displayImage = recipe.image_url?.startsWith('http') 
    ? `/api/proxy-image?url=${encodeURIComponent(recipe.image_url)}`
    : recipe.image_url;

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all hover:scale-[1.02] active:scale-95 flex flex-col h-full"
    >
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {!imageError ? (
          <img 
            src={displayImage} 
            alt={recipe.title} 
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground p-4 text-center">
            <Utensils className="h-12 w-12 mb-2 opacity-20" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Image Unavailable</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
            {recipe.source_name || 'Community'}
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
}

function App() {
  const [showForm, setShowForm] = useState(false)
  const [appError, setAppError] = useState<Error | null>(null)

  useEffect(() => {
    const errorHandler = (e: PromiseRejectionEvent | ErrorEvent) => {
      const error = 'reason' in e ? e.reason : e.error;
      console.error('Captured Global Error:', error);
      setAppError(error instanceof Error ? error : new Error(String(error)));
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', errorHandler);
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', errorHandler);
    };
  }, []);

  if (appError) return <ErrorFallback error={appError} />;

  return (
    <Router>
      <Layout onAddRecipe={() => setShowForm(true)}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/meal-plans" element={<MealPlans />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* Recipe Form Modal */}
      {showForm && (
        <RecipeForm 
          onClose={() => setShowForm(false)} 
          onSuccess={() => window.location.reload()} 
        />
      )}
    </Router>
  )
}

export default App
