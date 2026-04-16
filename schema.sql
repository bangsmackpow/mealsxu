-- Users and Auth
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user', -- 'user', 'admin'
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    is_archived INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Recipes
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    image_url TEXT,
    servings INTEGER DEFAULT 4,
    source_url TEXT,             -- Attribution URL
    source_name TEXT,            -- Attribution site name (e.g., "Taste of Home")
    views INTEGER DEFAULT 0,
    cart_adds INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Structured Ingredients (Mapped to Walmart)
CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    name TEXT NOT NULL,          -- e.g., "Ground Beef"
    quantity REAL NOT NULL,      -- e.g., 1.5
    unit TEXT NOT NULL,          -- e.g., "lb"
    walmart_item_id TEXT,        -- Mapped from Walmart API
    walmart_price REAL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

-- Dietary Tags
CREATE TABLE IF NOT EXISTS dietary_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_dietary_tags (
    recipe_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (recipe_id, tag_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (tag_id) REFERENCES dietary_tags(id)
);

-- Meal Planning
CREATE TABLE IF NOT EXISTS meal_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS planned_meals (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    day_of_week TEXT NOT NULL, -- 'Monday', etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES meal_plans(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

-- Audit and Settings
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Initial Midwest/Standard Seeding
INSERT OR IGNORE INTO dietary_tags (name) VALUES 
('Keto'), ('Low Salt'), ('Mediterranean'), ('Gluten-Free'), 
('Hotdish Friendly'), ('Low Carb'), ('Diabetic Friendly'), 
('Dairy Free'), ('Vegetarian'), ('High Protein');
