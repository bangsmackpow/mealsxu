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

export const onRequest = handle(app);
