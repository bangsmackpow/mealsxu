import React, { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, Link as LinkIcon, X } from 'lucide-react';

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface RecipeFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DIETARY_TAGS = [
  'Keto', 'Low Salt', 'Mediterranean', 'Gluten-Free', 
  'Hotdish Friendly', 'Low Carb', 'Diabetic Friendly',
  'Dairy Free', 'Vegetarian', 'High Protein'
];

const UNITS = ['lb', 'oz', 'cup', 'tbsp', 'tsp', 'unit', 'g', 'ml', 'bundle', 'head'];

export function RecipeForm({ onClose, onSuccess }: RecipeFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [servings, setServings] = useState(4);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', quantity: 1, unit: 'unit' }]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => setIngredients([...ingredients, { name: '', quantity: 1, unit: 'unit' }]);
  
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const recipeData = {
      title,
      description,
      instructions,
      servings,
      source_url: sourceUrl,
      source_name: sourceName,
      ingredients,
      tags: selectedTags
    };

    const formData = new FormData();
    formData.append('recipe', JSON.stringify(recipeData));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch('/api/user/recipes', {
        method: 'POST',
        body: formData,
        // Auth header would go here in a real app with JWT
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert('Failed to save recipe. Ensure you are logged in.');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Error saving recipe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-2xl border rounded-xl shadow-lg relative my-8">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-accent rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <header className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Add New Recipe</h2>
            <p className="text-muted-foreground">Share your Midwest favorite with the community.</p>
          </header>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipe Image</label>
                <div 
                  className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-muted/50 overflow-hidden relative group cursor-pointer"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload photo</span>
                    </>
                  )}
                  <input 
                    id="image-upload"
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input 
                  required
                  placeholder="e.g., Tater Tot Hotdish" 
                  className="w-full p-2 border rounded-md bg-background"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  placeholder="Short description of this meal..." 
                  className="w-full p-2 border rounded-md bg-background h-24"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Servings</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full p-2 border rounded-md bg-background"
                    value={servings}
                    onChange={e => setServings(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attribution</label>
                  <input 
                    placeholder="Site Name" 
                    className="w-full p-2 border rounded-md bg-background"
                    value={sourceName}
                    onChange={e => setSourceName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="h-3 w-3" /> Source URL
                </label>
                <input 
                  type="url"
                  placeholder="https://..." 
                  className="w-full p-2 border rounded-md bg-background"
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Dietary Tags</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Ingredients (Walmart Integration Ready)</label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Qty" 
                    className="w-20 p-2 border rounded-md bg-background" 
                    value={ing.quantity}
                    onChange={e => {
                      const n = [...ingredients];
                      n[i].quantity = parseFloat(e.target.value);
                      setIngredients(n);
                    }}
                  />
                  <select 
                    className="w-24 p-2 border rounded-md bg-background"
                    value={ing.unit}
                    onChange={e => {
                      const n = [...ingredients];
                      n[i].unit = e.target.value;
                      setIngredients(n);
                    }}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input 
                    required
                    placeholder="Ingredient name..." 
                    className="flex-1 p-2 border rounded-md bg-background"
                    value={ing.name}
                    onChange={e => {
                      const n = [...ingredients];
                      n[i].name = e.target.value;
                      setIngredients(n);
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => removeIngredient(i)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button 
              type="button"
              onClick={addIngredient}
              className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
            >
              <Plus className="h-4 w-4" /> Add Ingredient
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Instructions</label>
            <textarea 
              required
              placeholder="Step 1: Preheat oven... Step 2: Mix ingredients..." 
              className="w-full p-2 border rounded-md bg-background h-32"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-muted font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
