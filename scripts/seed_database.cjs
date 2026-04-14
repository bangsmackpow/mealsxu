const fs = require('fs');
const crypto = require('crypto');

const ADMIN_USER_ID = 'admin-user-id';
const TAGS = [
  { id: 1, name: 'Keto' },
  { id: 2, name: 'Low Salt' },
  { id: 3, name: 'Mediterranean' },
  { id: 4, name: 'Gluten-Free' },
  { id: 5, name: 'Hotdish Friendly' },
  { id: 6, name: 'Low Carb' },
  { id: 7, name: 'Diabetic Friendly' },
  { id: 8, name: 'Dairy Free' },
  { id: 9, name: 'Vegetarian' },
  { id: 10, name: 'High Protein' }
];

async function fetchRecipe() {
  const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
  const data = await res.json();
  return data.meals[0];
}

function parseIngredient(qtyStr) {
  if (!qtyStr) return { quantity: 1, unit: 'unit' };
  const match = qtyStr.match(/^([\d.\/]+)\s*(.*)$/);
  if (!match) return { quantity: 1, unit: qtyStr.trim() || 'unit' };
  
  let qty = match[1];
  if (qty.includes('/')) {
    const parts = qty.split('/');
    qty = parseFloat(parts[0]) / parseFloat(parts[1]);
  } else {
    qty = parseFloat(qty);
  }
  
  return {
    quantity: isNaN(qty) ? 1 : qty,
    unit: match[2].trim() || 'unit'
  };
}

function getIntelligentTags(meal, ingredients) {
  const tags = [];
  const text = (meal.strMeal + ' ' + meal.strCategory + ' ' + meal.strInstructions + ' ' + ingredients.join(' ')).toLowerCase();

  const isGlutenFree = !text.match(/flour|bread|pasta|wheat|rye|barley|couscous|semolina|farro/);
  const isDairyFree = !text.match(/milk|cream|butter|cheese|yogurt|whey|casein/);
  const isVegetarian = !text.match(/beef|pork|chicken|lamb|fish|seafood|shrimp|bacon|ham|turkey|steak/);
  const isKeto = !text.match(/sugar|flour|potato|rice|corn|bean|honey|bread|pasta|syrup/);
  const isHighProtein = !!text.match(/beef|pork|chicken|lamb|fish|seafood|shrimp|egg|tofu|nut|bean/);

  if (isGlutenFree) tags.push(4); // Gluten-Free
  if (isDairyFree) tags.push(8); // Dairy Free
  if (isVegetarian) tags.push(9); // Vegetarian
  if (isKeto) tags.push(1); // Keto
  if (isHighProtein) tags.push(10); // High Protein

  // Categories
  if (meal.strCategory === 'Vegetarian' || meal.strCategory === 'Vegan') {
    if (!tags.includes(9)) tags.push(9);
  }

  // Midwest logic (Hotdish Friendly)
  if (text.match(/casserole|hotdish|tater tot|cream of|baked/)) {
    tags.push(5);
  }

  // Diabetic Friendly
  if (isKeto || !text.match(/sugar|honey|syrup|high fructose/)) {
    tags.push(7);
  }

  // Mediterranean (Rough heuristic)
  if (text.match(/olive oil|fish|garlic|tomato|cucumber|chickpea|lemon/)) {
    tags.push(3);
  }

  return [...new Set(tags)].slice(0, 3);
}

async function seed() {
  const recipes = new Map();
  console.log('Fetching 50 unique recipes from TheMealDB...');

  while (recipes.size < 50) {
    const meal = await fetchRecipe();
    if (!recipes.has(meal.idMeal)) {
      recipes.set(meal.idMeal, meal);
      console.log(`Fetched: ${meal.strMeal} (${recipes.size}/50)`);
    }
  }

  let sql = '';

  for (const meal of recipes.values()) {
    const recipeId = crypto.randomUUID();
    const title = meal.strMeal.replace(/'/g, "''");
    const description = (meal.strArea + ' ' + meal.strCategory + ' dish').replace(/'/g, "''");
    const instructions = meal.strInstructions.replace(/'/g, "''");
    const imageUrl = meal.strMealThumb;
    const servings = Math.floor(Math.random() * 4) + 2;
    const sourceUrl = meal.strSource || meal.strYoutube || 'https://www.themealdb.com';
    const sourceName = meal.strSource ? new URL(meal.strSource).hostname : 'TheMealDB';

    sql += `INSERT INTO recipes (id, user_id, title, description, instructions, image_url, servings, source_url, source_name) VALUES ('${recipeId}', '${ADMIN_USER_ID}', '${title}', '${description}', '${instructions}', '${imageUrl}', ${servings}, '${sourceUrl}', '${sourceName}');\n`;

    const ingredientList = [];
    for (let i = 1; i <= 20; i++) {
      const name = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (name && name.trim()) {
        ingredientList.push(name);
        const { quantity, unit } = parseIngredient(measure);
        const ingId = crypto.randomUUID();
        sql += `INSERT INTO ingredients (id, recipe_id, name, quantity, unit) VALUES ('${ingId}', '${recipeId}', '${name.replace(/'/g, "''")}', ${quantity}, '${unit.replace(/'/g, "''")}');\n`;
      }
    }

    const selectedTags = getIntelligentTags(meal, ingredientList);
    for (const tagId of selectedTags) {
      sql += `INSERT INTO recipe_dietary_tags (recipe_id, tag_id) VALUES ('${recipeId}', ${tagId});\n`;
    }
    sql += '\n';
  }

  fs.writeFileSync('seed_intelligent_tags.sql', sql);
  console.log('Successfully generated seed_intelligent_tags.sql');
}

seed().catch(console.error);
