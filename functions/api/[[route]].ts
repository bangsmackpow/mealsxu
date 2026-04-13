import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { jwt } from 'hono/jwt';

type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
  WALMART_CLIENT_ID: string;
  WALMART_CLIENT_SECRET: string;
  WALMART_CONSUMER_ID: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

// Middleware for auth
const authMiddleware = (c: any, next: any) => {
  const middleware = jwt({ secret: c.env.JWT_SECRET });
  return middleware(c, next);
};

// Health Check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Auth Routes (Public)
app.post('/auth/register', async (c) => {
  // Implementation for user registration
  return c.json({ message: 'Register endpoint' });
});

app.post('/auth/login', async (c) => {
  // Implementation for user login
  return c.json({ message: 'Login endpoint' });
});

// Recipe Routes
app.get('/recipes', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM recipes WHERE is_archived = 0 ORDER BY created_at DESC').all();
  return c.json(results);
});

app.get('/recipes/:id', async (c) => {
  const id = c.req.param('id');
  const recipe = await c.env.DB.prepare('SELECT * FROM recipes WHERE id = ?').bind(id).first();
  const ingredients = await c.env.DB.prepare('SELECT * FROM ingredients WHERE recipe_id = ?').bind(id).all();
  const tags = await c.env.DB.prepare(`
    SELECT dt.name FROM dietary_tags dt 
    JOIN recipe_dietary_tags rdt ON dt.id = rdt.tag_id 
    WHERE rdt.recipe_id = ?
  `).bind(id).all();
  
  return c.json({ 
    ...recipe, 
    ingredients: ingredients.results,
    tags: tags.results.map(r => r.name)
  });
});

// Protected Recipe Routes
app.post('/user/recipes', authMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const user = c.get('jwtPayload');
  const recipeId = crypto.randomUUID();

  const recipeData = JSON.parse(body.recipe as string);
  
  // 1. Handle Image Upload to R2 or Use Existing URL
  let imageUrl = recipeData.imageUrl || '';
  const image = body.image as File;
  
  if (image && image.size > 0) {
    const key = `recipes/${recipeId}-${image.name}`;
    await c.env.R2.put(key, image.stream(), {
      httpMetadata: { contentType: image.type }
    });
    imageUrl = `/api/images/${key}`;
  }

  // 2. Save Recipe to D1
  await c.env.DB.prepare(`
    INSERT INTO recipes (id, user_id, title, description, instructions, image_url, servings, source_url, source_name) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    recipeId, user.id, recipeData.title, recipeData.description, 
    recipeData.instructions, imageUrl, recipeData.servings, 
    recipeData.source_url, recipeData.source_name
  ).run();

  // 3. Save Structured Ingredients
  const stmt = c.env.DB.prepare(
    'INSERT INTO ingredients (id, recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?, ?)'
  );
  
  const ingredientQueries = recipeData.ingredients.map((ing: any) => 
    stmt.bind(crypto.randomUUID(), recipeId, ing.name, ing.quantity, ing.unit)
  );
  
  // 4. Save Tags
  const tagStmt = c.env.DB.prepare('INSERT INTO recipe_dietary_tags (recipe_id, tag_id) SELECT ?, id FROM dietary_tags WHERE name = ?');
  const tagQueries = (recipeData.tags || []).map((tagName: string) => 
    tagStmt.bind(recipeId, tagName)
  );

  await c.env.DB.batch([...ingredientQueries, ...tagQueries]);

  return c.json({ success: true, id: recipeId });
});

// Getter for R2 Images
app.get('/images/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const object = await c.env.R2.get(key);
  if (!object) return c.notFound();
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  
  return new Response(object.body, { headers });
});

// Walmart Integration
app.post('/walmart/add-to-cart', async (c) => {
  // Service wrapper for Walmart API
  return c.json({ url: 'https://walmart.com/cart' });
});

// Admin Routes
app.get('/admin/metrics', authMiddleware, async (c) => {
  // Logic for admin dashboard metrics
  return c.json({ users: 0, recipes: 0, clicks: 0 });
});

export const onRequest = handle(app);
