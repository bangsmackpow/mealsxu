# Cloudflare AI Agent Skills

This project leverages [Cloudflare Skills](https://github.com/cloudflare/skills), a centralized source of truth for building and managing applications on the Cloudflare Developer Platform.

## Core Principles Followed
- **Compute:** Using Hono on Cloudflare Pages Functions for globally distributed, sub-millisecond API response times.
- **Storage (SQL):** Leveraging Cloudflare D1 for structured data (recipes, ingredients, users, meal plans).
- **Storage (Object):** Using Cloudflare R2 for recipe image uploads.
- **Security:** Managing secrets via Cloudflare Dashboard/Secrets. Using Bcrypt for secure hashing at the edge.
- **Networking:** Utilizing `cloudflare:sockets` for outbound TCP connections to personal mail servers (Stalwart).
- **Edge Resilience:** Implementation of an Image Proxy to bypass cross-origin restrictions and ensure 100% asset delivery.

## AI Agent Guidance
When operating on this project, AI agents should prioritize:
1. **The Edge:** Keep logic as close to the user as possible (Hono + D1).
2. **Type Safety:** Maintain strict TypeScript definitions (ESLint 9 Flat Config).
3. **Connectivity:** Use `fetch` for standard APIs and `cloudflare:sockets` for lower-level protocols (SMTP).
4. **Performance:** Stream R2 objects and proxy responses to minimize memory overhead.

---
*Referenced from https://github.com/cloudflare/skills (2026 Edition)*
