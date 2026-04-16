import { Context, Next, Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { jwt, sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { WalmartService } from './walmart';
import { EmailService } from './email';

type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
  WALMART_CLIENT_ID: string;
  WALMART_CLIENT_SECRET: string;
  WALMART_CONSUMER_ID: string;
  GOOGLE_CLIENT_ID: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

// --- Helpers ---

async function logAudit(db: D1Database, userId: string, action: string, details: string) {
  const id = crypto.randomUUID();
  await db.prepare('INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)')
    .bind(id, userId, action, details)
    .run();
}

async function getEmailConfig(db: D1Database, env: Bindings) {
  const { results } = await db.prepare('SELECT * FROM settings WHERE key LIKE "SMTP_%"').all();
  const config: Record<string, string> = {};
  results.forEach((r: any) => config[r.key] = r.value);
  
  return {
    host: config.SMTP_HOST || env.SMTP_HOST || '',
    port: parseInt(config.SMTP_PORT || env.SMTP_PORT || '587'),
    user: config.SMTP_USER || env.SMTP_USER || '',
    pass: config.SMTP_PASS || env.SMTP_PASS || '',
    from: config.SMTP_FROM || env.SMTP_FROM || ''
  };
}

// --- Middleware ---

const authMiddleware = (c: Context, next: Next) => {
  const middleware = jwt({ 
    secret: c.env.JWT_SECRET,
    alg: 'HS256'
  });
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

app.post('/auth/register', async (c) => {
  try {
    const { email, password } = await c.req.json();
    const existing = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (existing) return c.json({ error: 'User already exists' }, 400);

    const id = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);
    const verificationToken = crypto.randomUUID();

    await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, verification_token) VALUES (?, ?, ?, ?)')
      .bind(id, email, passwordHash, verificationToken)
      .run();

    const config = await getEmailConfig(c.env.DB, c.env);
    if (config.host) {
      const emailService = new EmailService(config.host, config.port, config.user, config.pass, config.from);
      await emailService.sendVerificationEmail(email, verificationToken);
    }

    return c.json({ success: true, message: 'Registration successful. Please verify your email.' });
  } catch (err: any) {
    return c.json({ error: 'Registration failed', details: err.message }, 500);
  }
});

app.get('/auth/verify', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ error: 'Missing token' }, 400);
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE verification_token = ?').bind(token).first();
  if (!user) return c.json({ error: 'Invalid or expired token' }, 400);
  await c.env.DB.prepare('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?').bind(user.id).run();
  return c.redirect('/login?verified=true');
});

app.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND is_archived = 0').bind(email).first();
    if (!user || !bcrypt.compareSync(password, user.password_hash as string)) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    const token = await sign({ id: user.id, email: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) + 86400 }, c.env.JWT_SECRET);
    return c.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// --- User Profile (Self-Service) ---

app.patch('/user/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('jwtPayload');
    const { email, oldPassword, newPassword } = await c.req.json();
    const dbUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
    if (!dbUser) return c.json({ error: 'User not found' }, 404);

    if (newPassword) {
      if (!oldPassword) return c.json({ error: 'Current password required' }, 400);
      if (!bcrypt.compareSync(oldPassword, dbUser.password_hash as string)) return c.json({ error: 'Incorrect password' }, 401);
    }

    let query = 'UPDATE users SET email = ?';
    const params = [email || dbUser.email];
    if (newPassword) {
      query += ', password_hash = ?';
      params.push(bcrypt.hashSync(newPassword, 10));
    }
    query += ' WHERE id = ?';
    params.push(user.id);

    await c.env.DB.prepare(query).bind(...params).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: 'Profile update failed' }, 500);
  }
});

// --- Admin System (Settings & Logs) ---

app.get('/admin/settings', authMiddleware, adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM settings').all();
  return c.json(results);
});

app.post('/admin/settings', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json();
  const queries = Object.entries(body).map(([key, value]) => 
    c.env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key, value)
  );
  await c.env.DB.batch(queries);
  await logAudit(c.env.DB, c.get('jwtPayload').id, 'UPDATE_SETTINGS', JSON.stringify(Object.keys(body)));
  return c.json({ success: true });
});

app.get('/admin/audit-logs', authMiddleware, adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT al.*, u.email as user_email 
    FROM audit_logs al 
    LEFT JOIN users u ON al.user_id = u.id 
    ORDER BY al.created_at DESC LIMIT 100
  `).all();
  return c.json(results);
});

// --- User Management ---

app.get('/admin/users', authMiddleware, adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, email, role, created_at, is_archived FROM users ORDER BY created_at DESC').all();
  return c.json(results);
});

app.post('/admin/users', authMiddleware, adminMiddleware, async (c) => {
  const { email, password, role } = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .bind(id, email, bcrypt.hashSync(password, 10), role || 'user').run();
  await logAudit(c.env.DB, c.get('jwtPayload').id, 'CREATE_USER', email);
  return c.json({ success: true, id });
});

app.patch('/admin/users/:id', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id');
  const { email, password, role, is_archived } = await c.req.json();
  let query = 'UPDATE users SET email = ?, role = ?, is_archived = ?';
  const params: any[] = [email, role, is_archived ? 1 : 0];
  if (password) { query += ', password_hash = ?'; params.push(bcrypt.hashSync(password, 10)); }
  query += ' WHERE id = ?'; params.push(id);
  await c.env.DB.prepare(query).bind(...params).run();
  await logAudit(c.env.DB, c.get('jwtPayload').id, 'UPDATE_USER', email);
  return c.json({ success: true });
});

// --- Recipe Management (Unified Edit Logic) ---

app.get('/user/meal-plans/current', authMiddleware, async (c) => {
  const user = c.get('jwtPayload');
  let plan = await c.env.DB.prepare('SELECT * FROM meal_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .bind(user.id).first();

  if (!plan) {
    const id = crypto.randomUUID();
    const name = `Week of ${new Date().toLocaleDateString()}`;
    await c.env.DB.prepare('INSERT INTO meal_plans (id, user_id, name) VALUES (?, ?, ?)')
      .bind(id, user.id, name).run();
    plan = { id, user_id: user.id, name };
  }

  const { results } = await c.env.DB.prepare(`
    SELECT pm.id as planned_meal_id, pm.day_of_week, r.*
    FROM planned_meals pm
    JOIN recipes r ON pm.recipe_id = r.id
    WHERE pm.plan_id = ?
  `).bind(plan.id).all();

  return c.json({ plan, meals: results });
});

app.post('/user/meal-plans', authMiddleware, async (c) => {
  const user = c.get('jwtPayload');
  const { recipeId, dayOfWeek } = await c.req.json();
  let plan = await c.env.DB.prepare('SELECT id FROM meal_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .bind(user.id).first();

  if (!plan) {
    const id = crypto.randomUUID();
    await c.env.DB.prepare('INSERT INTO meal_plans (id, user_id, name) VALUES (?, ?, ?)')
      .bind(id, user.id, `Week of ${new Date().toLocaleDateString()}`).run();
    plan = { id };
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare('INSERT INTO planned_meals (id, plan_id, recipe_id, day_of_week) VALUES (?, ?, ?, ?)')
    .bind(id, plan.id, recipeId, dayOfWeek).run();

  return c.json({ success: true, id });
});

app.delete('/user/meal-plans/meals/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM planned_meals WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

app.get('/user/meal-plans/current/grocery-list', authMiddleware, async (c) => {
  const user = c.get('jwtPayload');
  const plan = await c.env.DB.prepare('SELECT id FROM meal_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .bind(user.id).first();

  if (!plan) return c.json([]);

  const { results } = await c.env.DB.prepare(`
    SELECT i.name, i.quantity, i.unit
    FROM ingredients i
    JOIN planned_meals pm ON i.recipe_id = pm.recipe_id
    WHERE pm.plan_id = ?
  `).bind(plan.id).all();

  const aggregated: Record<string, any> = {};
  results.forEach((ing: any) => {
    const key = `${ing.name.toLowerCase()}_${ing.unit.toLowerCase()}`;
    if (aggregated[key]) {
      aggregated[key].quantity += ing.quantity;
    } else {
      aggregated[key] = { ...ing };
    }
  });

  return c.json(Object.values(aggregated));
});

app.patch('/recipes/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('jwtPayload');
  const body = await c.req.json();

  const recipe = await c.env.DB.prepare('SELECT user_id FROM recipes WHERE id = ?').bind(id).first();
  if (!recipe) return c.notFound();
  if (user.role !== 'admin' && recipe.user_id !== user.id) return c.json({ error: 'Unauthorized' }, 403);

  await c.env.DB.prepare('UPDATE recipes SET title = ?, description = ?, instructions = ? WHERE id = ?')
    .bind(body.title, body.description, body.instructions, id).run();
  
  await logAudit(c.env.DB, user.id, 'UPDATE_RECIPE', id);
  return c.json({ success: true });
});

app.get('/recipes', async (c) => {
  const tag = c.req.query('tag');
  let query = 'SELECT * FROM recipes WHERE is_archived = 0';
  const params: any[] = [];
  if (tag) {
    query = 'SELECT r.* FROM recipes r JOIN recipe_dietary_tags rdt ON r.id = rdt.recipe_id JOIN dietary_tags dt ON rdt.tag_id = dt.id WHERE r.is_archived = 0 AND dt.name = ?';
    params.push(tag);
  }
  query += ' ORDER BY created_at DESC';
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

app.get('/recipes/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE recipes SET views = views + 1 WHERE id = ?').bind(id).run();
  const recipe = await c.env.DB.prepare('SELECT * FROM recipes WHERE id = ?').bind(id).first();
  const ingredients = await c.env.DB.prepare('SELECT * FROM ingredients WHERE recipe_id = ?').bind(id).all();
  const tags = await c.env.DB.prepare('SELECT dt.name FROM dietary_tags dt JOIN recipe_dietary_tags rdt ON dt.id = rdt.tag_id WHERE rdt.recipe_id = ?').bind(id).all();
  return c.json({ ...recipe, ingredients: ingredients.results, tags: tags.results.map((r: any) => r.name) });
});

// --- Image Services ---

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
  const ingredientQueries = recipeData.ingredients.map((ing: any) =>
    stmt.bind(crypto.randomUUID(), recipeId, ing.name, ing.quantity, ing.unit)
  );

  const tagStmt = c.env.DB.prepare('INSERT INTO recipe_dietary_tags (recipe_id, tag_id) SELECT ?, id FROM dietary_tags WHERE name = ?');
  const tagQueries = (recipeData.tags || []).map((tagName: string) => tagStmt.bind(recipeId, tagName));

  await c.env.DB.batch([...ingredientQueries, ...tagQueries]);
  return c.json({ success: true, id: recipeId });
});

app.post('/walmart/map-ingredients', authMiddleware, async (c) => {
  const { ingredients, zipCode } = await c.req.json();
  const walmart = new WalmartService(c.env.WALMART_CLIENT_ID, c.env.WALMART_CLIENT_SECRET, c.env.WALMART_CONSUMER_ID);
  try {
    const items = await walmart.mapIngredientsToItems(ingredients, zipCode);
    return c.json(items);
  } catch (err: any) {
    return c.json({ error: 'Walmart mapping failed', details: err.message }, 500);
  }
});

app.post('/walmart/create-bundle', authMiddleware, async (c) => {
  const { items, recipeIds } = await c.req.json();
  const walmart = new WalmartService(c.env.WALMART_CLIENT_ID, c.env.WALMART_CLIENT_SECRET, c.env.WALMART_CONSUMER_ID);
  try {
    const bundleUrl = await walmart.createBundleUrl(items);
    if (recipeIds?.length) {
      const stmt = c.env.DB.prepare('UPDATE recipes SET cart_adds = cart_adds + 1 WHERE id = ?');
      await c.env.DB.batch(recipeIds.map((id: string) => stmt.bind(id)));
    }
    return c.json({ url: bundleUrl });
  } catch (err: any) {
    return c.json({ error: 'Walmart bundle failed', details: err.message }, 500);
  }
});

app.get('/proxy-image', async (c) => {
  const url = c.req.query('url');
  if (!url) return c.notFound();

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        'Referer': new URL(url).origin
      }
    });

    if (!response.ok) throw new Error('Failed to fetch image');

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new Response(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800',
      }
    });
  } catch (err) {
    console.error('Proxy Image Error:', err);
    return c.notFound();
  }
});

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
