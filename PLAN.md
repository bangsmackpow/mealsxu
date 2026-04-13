# Mealsxu: Shoppable Recipe App - Project Plan

Mealsxu is a React-based web application running on Cloudflare Pages, providing a seamless "Recipe-to-Cart" experience integrated with Walmart.

## 1. Core Architecture
- **Frontend:** React + Tailwind CSS + shadcn/ui.
- **Backend:** Hono running on Cloudflare Pages Functions.
- **Database:** Cloudflare D1 (SQL) for users, recipes, and dietary data.
- **Storage:** Cloudflare R2 for recipe images.
- **Integration:** Walmart.io Recipes & Bundle APIs (v2).
- **Auth:** Custom D1-based JWT authentication.

## 2. SQL Schema (`schema.sql`)
The schema will support multi-user access, dietary filtering, and Walmart item mapping.

- `users`: id, email, password_hash, role (user/admin), created_at.
- `recipes`: id, user_id, title, description, image_url, instructions, price_per_meal, created_at.
- `ingredients`: id, recipe_id, name, quantity, unit, walmart_item_id, walmart_price.
- `dietary_tags`: id, name (Keto, Low Salt, Mediterranean, Gluten-Free, Hotdish-Friendly, Low Carb, Diabetic Friendly).
- `recipe_tags`: recipe_id, tag_id.
- `sessions`: id, user_id, token, expires_at.

## 3. Walmart Integration Strategy
- **Structured Input:** UI will use separate fields for Quantity, Unit, and Ingredient Name to ensure high-quality data for the Walmart API.
- **I2P Mapping:** Ingredients will be mapped to Walmart products using the `Recipe Products API`.
- **Cart Creation:** Use the `Bundle API` to create a shoppable cart link for the user.
- **Pricing:** Fetch real-time prices based on the user's zip code (defaulting to a Midwest zip code if unknown).

## 4. Midwest-Specific Dietary Filters
- **Keto / Low Carb:** Focus on high-protein, low-sugar.
- **Low Salt:** Heart-healthy options (Crucial for Midwest demographics).
- **Mediterranean:** Focus on olive oil and fish.
- **Gluten-Free:** Standard requirement.
- **Hotdish/Casserole Friendly:** Optimization for bulk-buy ingredients (Cream of Mushroom subs, etc.).
- **Diabetic Friendly:** Low glycemic index focus.

## 5. Admin Dashboard & Metrics
- **User Management:** CRUD users, reset passwords.
- **Recipe Moderation:** Review and archive user-uploaded recipes.
- **Metrics:**
  - Most popular recipes (by "Add to Cart" clicks).
  - Total Affiliate revenue generated (estimated).
  - User growth over time.
  - Distribution of dietary tag usage.

## 6. Monetization Implementation
- **Walmart Affiliate:** Append `affiliateId` to all Walmart cart/product links.
- **Ad Placement:** Reserved slots in the Recipe List and Recipe Detail pages for CPG (Consumer Packaged Goods) ads via a lightweight ad manager.

## 7. Development Roadmap
1. **Infra Setup:** D1 migrations, R2 buckets, and Hono bindings.
2. **Auth & Admin:** Implement JWT flow and basic user management.
3. **Recipe Engine:** CRUD for recipes with structured ingredient inputs.
4. **Walmart Service:** Implement the OAuth and Mapping service in Hono.
5. **Frontend UI:** Build components using shadcn/ui (Card, Badge, Command, etc.).
6. **Pricing & Bulk:** Add logic for "Price per Meal" and bulk ordering.

## 8. Frontend Components (shadcn/ui)
- `Card`: For recipe thumbnails.
- `Badge`: For dietary tags.
- `Command`: For searching recipes/ingredients.
- `Dialog`: For recipe upload and login.
- `Input` / `Select`: For structured ingredient entry.
- `Table`: For admin user lists and metrics.
