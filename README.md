# Mealsxu: Shoppable Recipes for the Midwest

Mealsxu is a high-performance, edge-first recipe platform built on **Cloudflare Pages**, **Hono**, and **React**. It bridges the gap between digital meal inspiration and physical grocery fulfillment by integrating directly with the **Walmart.io Recipes & Bundle APIs**.

## 🎨 Features

- **Edge-Powered Backend:** Built with Hono for sub-millisecond API response times across the globe.
- **Midwest Dietary Focus:** Specialized filters for local preferences, including **Keto**, **Low Salt**, **Gluten-Free**, and **Hotdish Friendly**.
- **Walmart Cart Integration:** Seamlessly map recipe ingredients to real-time Walmart inventory and create shoppable carts with one click.
- **Bulk Order Optimization:** Real-time pricing with "Price per Meal" and "Bulk Order" cost breakdowns.
- **Unified UI:** A clean, modern dashboard built with **shadcn/ui**, **Tailwind CSS**, and **Lucide** icons.
- **Image-to-Recipe:** Support for image uploads stored on **Cloudflare R2** with metadata tracked in **Cloudflare D1**.

## 🚀 Tech Stack

- **Frontend:** React (TypeScript), Vite, Tailwind CSS, shadcn/ui.
- **Backend:** Hono running on Cloudflare Pages Functions.
- **Database:** Cloudflare D1 (SQL) for user profiles, recipes, and dietary tags.
- **Storage:** Cloudflare R2 for recipe image uploads.
- **Auth:** Custom JWT-based authentication stored in D1.
- **Standards:** ESLint 9 (Flat Config) with strict TypeScript rules.
- **Guidance:** Following [Cloudflare Skills](https://github.com/cloudflare/skills) best practices.
- **Integration:** Walmart.io Commerce APIs (I2P V2).

## 🛠️ Local Development

### Prerequisites
- Node.js (v18+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-config/)

### Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/bangsmackpow/mealxu.git
   cd mealxu
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Linting:**
   ```bash
   npm run lint
   ```

3. **Database Setup:**
   The database `mealsxu-db` is already initialized on Cloudflare. To run locally, initialize your local D1:
   ```bash
   npx wrangler d1 execute mealsxu-db --local --file=schema.sql
   ```

4. **Secrets and Environment Variables:**
   Set up your secrets for local development in a `.dev.vars` file (this is gitignored):
   ```
   JWT_SECRET="your-secret"
   WALMART_CLIENT_ID="your-id"
   WALMART_CLIENT_SECRET="your-secret"
   WALMART_CONSUMER_ID="your-consumer-id"
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   # To test Cloudflare Functions locally:
   npm run pages:dev
   ```

## 📈 Roadmap & Monetization

- [ ] **Walmart Affiliate Integration:** Earn commissions on every item added to a user's cart.
- [ ] **CPG Ad Slots:** Targeted advertising for grocery brands based on recipe ingredients.
- [ ] **Meal Planning:** Recurring weekly shopping lists for premium users.
- [ ] **Mobile App:** Potential export via Capacitor or React Native.

## 📄 License
MIT License. Created by [bangsmackpow](https://github.com/bangsmackpow).
