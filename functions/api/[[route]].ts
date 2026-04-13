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
  const { results } = await c.env.DB.prepare('SELECT * FROM recipes WHERE is_archived = 0').all();
  return c.json(results);
});

app.get('/recipes/:id', async (c) => {
  const id = c.req.param('id');
  const recipe = await c.env.DB.prepare('SELECT * FROM recipes WHERE id = ?').bind(id).first();
  const ingredients = await c.env.DB.prepare('SELECT * FROM ingredients WHERE recipe_id = ?').bind(id).all();
  return c.json({ ...recipe, ingredients: ingredients.results });
});

// Protected Recipe Routes
app.post('/user/recipes', authMiddleware, async (c) => {
  // Logic to save recipe and ingredients
  return c.json({ message: 'Recipe created' });
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
