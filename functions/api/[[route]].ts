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
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

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
    
    // Check if user exists
    const existing = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (existing) return c.json({ error: 'User already exists' }, 400);

    const id = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);
    const verificationToken = crypto.randomUUID();

    await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, verification_token) VALUES (?, ?, ?, ?)')
      .bind(id, email, passwordHash, verificationToken)
      .run();

    // Send actual verification email via Stalwart
    const emailService = new EmailService(
      c.env.SMTP_HOST,
      parseInt(c.env.SMTP_PORT),
      c.env.SMTP_USER,
      c.env.SMTP_PASS,
      c.env.SMTP_FROM
    );
    
    await emailService.sendVerificationEmail(email, verificationToken);

    return c.json({ success: true, message: 'Registration successful. Please verify your email.' });
  } catch (err: any) {
    return c.json({ error: 'Registration failed', details: err.message }, 500);
  }
});

app.get('/auth/verify', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ error: 'Missing token' }, 400);

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE verification_token = ?')
    .bind(token)
    .first();

  if (!user) return c.json({ error: 'Invalid or expired token' }, 400);

  await c.env.DB.prepare('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?')
    .bind(user.id)
    .run();

  return c.redirect('/login?verified=true');
});

app.post('/auth/google', async (c) => {
  try {
    const { credential } = await c.req.json();
    // In a real app, you MUST verify the token with Google's public keys
    // For this scaffold, we'll decode it to get the email (Note: insecure without verification)
    const payloadBase64 = credential.split('.')[1];
    const googleUser = JSON.parse(atob(payloadBase64));

    if (!googleUser.email_verified) return c.json({ error: 'Google email not verified' }, 401);

    const email = googleUser.email;
    const googleId = googleUser.sub;

    // Check if user exists by email or google_id
    let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? OR google_id = ?')
      .bind(email, googleId)
      .first();

    if (user) {
      // Merge: Update google_id and mark as verified if they weren't
      await c.env.DB.prepare('UPDATE users SET google_id = ?, is_verified = 1 WHERE id = ?')
        .bind(googleId, user.id)
        .run();
    } else {
      // Create new user
      const id = crypto.randomUUID();
      await c.env.DB.prepare('INSERT INTO users (id, email, google_id, is_verified, password_hash) VALUES (?, ?, ?, 1, "oauth_user")')
        .bind(id, email, googleId)
        .run();
      user = { id, email, role: 'user' };
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
    };

    const token = await sign(payload, c.env.JWT_SECRET);
    return c.json({ token, user: { id: user.id, email: user.email, role: user.role || 'user' } });
  } catch (err: any) {
    return c.json({ error: 'Google login failed', details: err.message }, 500);
  }
});

app.post('/auth/login', async (c) => {
  try {
    console.log('Login attempt started');
    
    if (!c.env.JWT_SECRET || c.env.JWT_SECRET === 'super-secret-key') {
      console.error('JWT_SECRET is missing or using default placeholder');
      return c.json({ error: 'Server configuration error: JWT_SECRET not found. Please check Cloudflare environment variables and redeploy.' }, 500);
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

// --- User Profile (Self-Service) ---

app.patch('/user/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('jwtPayload');
    const { email, oldPassword, newPassword } = await c.req.json();

    // 1. Fetch current user
    const dbUser = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(user.id)
      .first();

    if (!dbUser) return c.json({ error: 'User not found' }, 404);

    // 2. If changing password, verify old one
    if (newPassword) {
      if (!oldPassword) return c.json({ error: 'Current password required to set a new one' }, 400);
      const isMatch = bcrypt.compareSync(oldPassword, dbUser.password_hash as string);
      if (!isMatch) return c.json({ error: 'Incorrect current password' }, 401);
    }

    // 3. Update record
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
    return c.json({ error: 'Failed to update profile', details: err.message }, 500);
  }
});

// --- Meal Planning ---

app.get('/user/meal-plans/current', authMiddleware, async (c) => {
  const user = c.get('jwtPayload');
  
  // 1. Get or create current plan (for simplicity, we'll just look for the most recent one or return empty)
  let plan = await c.env.DB.prepare('SELECT * FROM meal_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .bind(user.id)
    .first();

  if (!plan) {
    const id = crypto.randomUUID();
    const name = `Week of ${new Date().toLocaleDateString()}`;
    await c.env.DB.prepare('INSERT INTO meal_plans (id, user_id, name) VALUES (?, ?, ?)')
      .bind(id, user.id, name)
      .run();
    plan = { id, user_id: user.id, name };
  }

  // 2. Fetch all planned meals joined with recipe basic info
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

  // Get current plan
  let plan = await c.env.DB.prepare('SELECT id FROM meal_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .bind(user.id)
    .first();

  if (!plan) {
    const id = crypto.randomUUID();
    await c.env.DB.prepare('INSERT INTO meal_plans (id, user_id, name) VALUES (?, ?, ?)')
      .bind(id, user.id, `Week of ${new Date().toLocaleDateString()}`)
      .run();
    plan = { id };
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare('INSERT INTO planned_meals (id, plan_id, recipe_id, day_of_week) VALUES (?, ?, ?, ?)')
    .bind(id, plan.id, recipeId, dayOfWeek)
    .run();

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
    .bind(user.id)
    .first();

  if (!plan) return c.json({ ingredients: [] });

  // Fetch all ingredients for all recipes in the plan
  const { results } = await c.env.DB.prepare(`
    SELECT i.name, i.quantity, i.unit
    FROM ingredients i
    JOIN planned_meals pm ON i.recipe_id = pm.recipe_id
    WHERE pm.plan_id = ?
  `).bind(plan.id).all();

  // Aggregate quantities
  const aggregated: Record<string, { quantity: number, unit: string }> = {};
  
  results.forEach((ing: any) => {
    const key = `${ing.name.toLowerCase()}_${ing.unit.toLowerCase()}`;
    if (aggregated[key]) {
      aggregated[key].quantity += ing.quantity;
    } else {
      aggregated[key] = { quantity: ing.quantity, unit: ing.unit, name: ing.name };
    }
  });

  return c.json(Object.values(aggregated));
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

// Image Proxy (Fix for broken external images)
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
    
    // Stream the image back to the browser with caching headers
    return new Response(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800', // Cache for 7 days
      }
    });
  } catch (err) {
    console.error('Proxy Image Error:', err);
    return c.notFound();
  }
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

// --- Walmart Integration ---

app.post('/walmart/map-ingredients', authMiddleware, async (c) => {
  const { ingredients, zipCode } = await c.req.json();
  const walmart = new WalmartService(
    c.env.WALMART_CLIENT_ID,
    c.env.WALMART_CLIENT_SECRET,
    c.env.WALMART_CONSUMER_ID
  );

  try {
    const items = await walmart.mapIngredientsToItems(ingredients, zipCode);
    return c.json(items);
  } catch (err: any) {
    return c.json({ error: 'Walmart mapping failed', details: err.message }, 500);
  }
});

app.post('/walmart/create-bundle', authMiddleware, async (c) => {
  const { items, recipeIds } = await c.req.json();
  const walmart = new WalmartService(
    c.env.WALMART_CLIENT_ID,
    c.env.WALMART_CLIENT_SECRET,
    c.env.WALMART_CONSUMER_ID
  );

  try {
    const bundleUrl = await walmart.createBundleUrl(items);
    
    // Update metrics
    if (recipeIds && Array.isArray(recipeIds)) {
      const stmt = c.env.DB.prepare('UPDATE recipes SET cart_adds = cart_adds + 1 WHERE id = ?');
      await c.env.DB.batch(recipeIds.map(id => stmt.bind(id)));
    }

    return c.json({ url: bundleUrl });
  } catch (err: any) {
    return c.json({ error: 'Walmart bundle creation failed', details: err.message }, 500);
  }
});

export const onRequest = handle(app);
