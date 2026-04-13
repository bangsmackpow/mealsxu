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
  // Simple parser for quantity and unit
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

  let sql = 'BEGIN TRANSACTION;\n\n';

  for (const meal of recipes.values()) {
    const recipeId = crypto.randomUUID();
    const title = meal.strMeal.replace(/'/g, "''");
    const description = (meal.strArea + ' ' + meal.strCategory + ' dish').replace(/'/g, "''");
    const instructions = meal.strInstructions.replace(/'/g, "''");
    const imageUrl = meal.strMealThumb;
    const servings = Math.floor(Math.random() * 4) + 2; // 2-6
    const sourceUrl = meal.strSource || meal.strYoutube || 'https://www.themealdb.com';
    const sourceName = meal.strSource ? new URL(meal.strSource).hostname : 'TheMealDB';

    sql += `INSERT INTO recipes (id, user_id, title, description, instructions, image_url, servings, source_url, source_name) VALUES ('${recipeId}', '${ADMIN_USER_ID}', '${title}', '${description}', '${instructions}', '${imageUrl}', ${servings}, '${sourceUrl}', '${sourceName}');\n`;

    // Ingredients
    for (let i = 1; i <= 20; i++) {
      const name = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (name && name.trim()) {
        const { quantity, unit } = parseIngredient(measure);
        const ingId = crypto.randomUUID();
        sql += `INSERT INTO ingredients (id, recipe_id, name, quantity, unit) VALUES ('${ingId}', '${recipeId}', '${name.replace(/'/g, "''")}', ${quantity}, '${unit.replace(/'/g, "''")}');\n`;
      }
    }

    // Random Tags
    const numTags = Math.floor(Math.random() * 2) + 1;
    const selectedTags = [...TAGS].sort(() => 0.5 - Math.random()).slice(0, numTags);
    for (const tag of selectedTags) {
      sql += `INSERT INTO recipe_dietary_tags (recipe_id, tag_id) VALUES ('${recipeId}', ${tag.id});\n`;
    }
    sql += '\n';
  }

  sql += 'COMMIT;';
  fs.writeFileSync('seed_themealdb_full.sql', sql);
  console.log('Successfully generated seed_themealdb_full.sql');
}

seed().catch(console.error);
