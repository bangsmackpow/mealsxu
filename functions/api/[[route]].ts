import { Context, Next, Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { jwt, sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';

type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
  WALMART_CLIENT_ID: string;
  WALMART_CLIENT_SECRET: string;
  WALMART_CONSUMER_ID: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

// --- Middleware ---

const authMiddleware = (c: Context, next: Next) => {
  const middleware = jwt({ secret: c.env.JWT_SECRET });
  return middleware(c, next);
};

const adminMiddleware = async (c: Context, next: Next) => {
  const payload = c.get('jwtPayload');
  if (payload?.role !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  await next();
};

// --- Auth Routes ---

app.post('/auth/login', async (c) => {
  try {
    console.log('Login attempt started');
    
    if (!c.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing from environment');
      return c.json({ error: 'Server configuration error' }, 500);
    }

    const body = await c.req.json().catch(e => {
      console.error('Failed to parse JSON body:', e);
      return null;
    });

    if (!body || !body.email || !body.password) {
      console.error('Missing email or password in request');
      return c.json({ error: 'Missing credentials' }, 400);
    }

    const { email, password } = body;
    console.log(`Searching for user: ${email}`);

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND is_archived = 0')
      .bind(email)
      .first();

    if (!user) {
      console.log('User not found or archived');
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    console.log('User found, verifying password');
    if (!user.password_hash) {
      console.error('User record missing password_hash');
      return c.json({ error: 'Invalid user record' }, 500);
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash as string);
    console.log(`Password match: ${passwordMatch}`);

    if (!passwordMatch) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
    };

    console.log('Signing JWT');
    const token = await sign(payload, c.env.JWT_SECRET);
    console.log('Login successful');
    return c.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    console.error('CRITICAL Login Error:', err);
    return c.json({ error: 'Internal Server Error', details: err.message, stack: err.stack }, 500);
  }
});

// --- User Management (Admin Only) ---

app.get('/admin/users', authMiddleware, adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, email, role, created_at, is_archived FROM users ORDER BY created_at DESC').all();
  return c.json(results);
});

app.post('/admin/users', authMiddleware, adminMiddleware, async (c) => {
  const { email, password, role } = await c.req.json();
  const id = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  
  await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .bind(id, email, passwordHash, role || 'user')
    .run();
  return c.json({ success: true, id });
});

app.patch('/admin/users/:id', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id');
  const { email, password, role, is_archived } = await c.req.json();
  
  let query = 'UPDATE users SET email = ?, role = ?, is_archived = ?';
  const params: any[] = [email, role, is_archived ? 1 : 0];
  
  if (password) {
    const passwordHash = bcrypt.hashSync(password, 10);
    query += ', password_hash = ?';
    params.push(passwordHash);
  }
  
  query += ' WHERE id = ?';
  params.push(id);

  await c.env.DB.prepare(query).bind(...params).run();
  return c.json({ success: true });
});

// --- Metrics ---

app.get('/admin/metrics', authMiddleware, adminMiddleware, async (c) => {
  const stats = await c.env.DB.batch([
    c.env.DB.prepare('SELECT COUNT(*) as count FROM recipes'),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM users'),
    c.env.DB.prepare('SELECT title, views FROM recipes ORDER BY views DESC LIMIT 5'),
    c.env.DB.prepare('SELECT title, cart_adds FROM recipes ORDER BY cart_adds DESC LIMIT 5')
  ]);

  return c.json({
    totalRecipes: stats[0].results[0].count,
    totalUsers: stats[1].results[0].count,
    topVisited: stats[2].results,
    topInCart: stats[3].results
  });
});

// --- Recipe Routes ---

app.get('/recipes', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM recipes WHERE is_archived = 0 ORDER BY created_at DESC').all();
  return c.json(results);
});

app.get('/recipes/:id', async (c) => {
  const id = c.req.param('id');
  // Record view
  await c.env.DB.prepare('UPDATE recipes SET views = views + 1 WHERE id = ?').bind(id).run();
  
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
  
  let imageUrl = recipeData.imageUrl || '';
  const image = body.image as File;
  
  if (image && image.size > 0) {
    const key = `recipes/${recipeId}-${image.name}`;
    await c.env.R2.put(key, image.stream(), {
      httpMetadata: { contentType: image.type }
    });
    imageUrl = `/api/images/${key}`;
  }

  await c.env.DB.prepare(`
    INSERT INTO recipes (id, user_id, title, description, instructions, image_url, servings, source_url, source_name) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    recipeId, user.id, recipeData.title, recipeData.description, 
    recipeData.instructions, imageUrl, recipeData.servings, 
    recipeData.source_url, recipeData.source_name
  ).run();

  const stmt = c.env.DB.prepare('INSERT INTO ingredients (id, recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?, ?)');
  interface RecipeIngredient { name: string; quantity: number; unit: string; }
  const ingredientQueries = recipeData.ingredients.map((ing: RecipeIngredient) => 
    stmt.bind(crypto.randomUUID(), recipeId, ing.name, ing.quantity, ing.unit)
  );
  
  const tagStmt = c.env.DB.prepare('INSERT INTO recipe_dietary_tags (recipe_id, tag_id) SELECT ?, id FROM dietary_tags WHERE name = ?');
  const tagQueries = (recipeData.tags || []).map((tagName: string) => tagStmt.bind(recipeId, tagName));

  await c.env.DB.batch([...ingredientQueries, ...tagQueries]);
  return c.json({ success: true, id: recipeId });
});

// Image Proxy
app.get('/images/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const object = await c.env.R2.get(key);
  if (!object) return c.notFound();
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  return new Response(object.body, { headers });
});

export const onRequest = handle(app);
