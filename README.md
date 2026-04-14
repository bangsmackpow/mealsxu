# Mealsxu: Shoppable Recipes for the Midwest

Mealsxu is a high-performance, edge-first recipe platform built on **Cloudflare Pages**, **Hono**, and **React**. It bridges the gap between digital meal inspiration and physical grocery fulfillment by integrating directly with the **Walmart.io Recipes & Bundle APIs**.

## 🎨 Features

- **Edge-Powered Backend:** Built with Hono for sub-millisecond API response times across the globe.
- **Intelligent Dietary Filtering:** Automated ingredient scanning for **Keto**, **Low Salt**, **Gluten-Free**, **Dairy Free**, and **Vegetarian** compliance.
- **Midwest Focus:** Specialized "Hotdish Friendly" logic for local favorites.
- **Walmart Cart Integration:** Aggregated "Grocery Payloads" mapped directly to real Walmart inventory with one-click "Buy Now" bundles.
- **Secure Authentication:** Multi-auth system with **Google OAuth**, **Bcrypt** hashed passwords, and **Stalwart SMTP** email verification via Cloudflare Worker Sockets.
- **High-Fidelity Content:** 50+ real recipes from curated sources with verified images and mandatory attribution for liability protection.
- **Admin Command Center:** Full user management (CRUD/Archive) and live telemetry metrics (Views, Conversions).
- **Weekly Strategy:** Persistent meal planning with real-time cost estimation and bulk-purchase optimization.
- **High-Performance Image Proxy:** Bypasses CORS and hotlinking blocks to ensure every dish photo loads perfectly.

## 🚀 Tech Stack

- **Frontend:** React 18, Vite 8, Tailwind CSS, shadcn/ui, Lucide Icons.
- **Backend:** Hono running on Cloudflare Pages Functions.
- **Database:** Cloudflare D1 (SQL) for users, recipes, plans, and metrics.
- **Storage:** Cloudflare R2 for recipe image uploads.
- **Auth:** JWT-based session management with HS256 signing.
- **Standards:** ESLint 9 (Flat Config) with strict TypeScript rules.

## 🛠️ Local Development

### Prerequisites
- Node.js (v22+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-config/)

### Setup
1. **Clone & Install:**
   ```bash
   git clone https://github.com/bangsmackpow/mealxu.git
   cd mealxu
   npm install
   ```

2. **Infrastructure:**
   ```bash
   # Initialize local D1
   npx wrangler d1 execute mealsxu-db --local --file=schema.sql
   # Seed with high-fidelity data
   node scripts/seed_database.cjs
   ```

3. **Secrets:** Create `.dev.vars` for local development:
   ```env
   JWT_SECRET="your-secret"
   WALMART_CLIENT_ID="your-id"
   WALMART_CLIENT_SECRET="your-secret"
   WALMART_CONSUMER_ID="your-consumer-id"
   SMTP_HOST="your-stalwart-host"
   ...
   ```

4. **Run:**
   ```bash
   npm run dev
   # For full stack testing:
   npm run pages:dev
   ```

## 📈 Roadmap

- [x] **Intelligent Tagging:** Automatic filter compliance based on ingredient lists.
- [x] **Secure User Profiles:** Self-service password management.
- [ ] **Print Protocol:** Foldable "Hamburger Style" clean recipe printouts.
- [ ] **Mobile Export:** PWA/Capacitor integration for in-store usage.

## 📄 License
MIT License. Created by [bangsmackpow](https://github.com/bangsmackpow).
