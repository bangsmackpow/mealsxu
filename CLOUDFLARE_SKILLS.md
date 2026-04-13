# Cloudflare AI Agent Skills

This project leverages [Cloudflare Skills](https://github.com/cloudflare/skills), a centralized source of truth for building and managing applications on the Cloudflare Developer Platform.

## Core Principles Followed
- **Compute:** Using Hono on Cloudflare Pages Functions for globally distributed, sub-millisecond API response times.
- **Storage (SQL):** Leveraging Cloudflare D1 for structured data (recipes, ingredients, users).
- **Storage (Object):** Using Cloudflare R2 for recipe images with metadata stored in D1.
- **Security:** Managing secrets via Cloudflare Dashboard/Secrets to prevent credential leakage.

## AI Agent Guidance
When operating on this project, AI agents should prioritize:
1. **The Edge:** Keep logic as close to the user as possible (Hono + D1).
2. **Type Safety:** Maintain strict TypeScript definitions (e.g., `RecipeIngredient`, `Context`, `Next`).
3. **Infrastructure as Code:** Ensure `wrangler.toml` and `schema.sql` are up-to-date.
4. **Resilience:** Use proper error handling for network-bound operations (e.g., R2 uploads, Walmart API calls).

---
*Referenced from https://github.com/cloudflare/skills (2026 Edition)*
