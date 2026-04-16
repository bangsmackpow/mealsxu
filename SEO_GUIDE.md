# Mealsxu: Search Engine Optimization & Submission Guide

To ensure **Mealsxu** is indexed by Google, Bing, and other search engines, follow this comprehensive guide.

## 1. Technical SEO Implemented
The platform now includes core technical SEO foundations:
- **Canonical URLs:** Prevents duplicate content issues.
- **Dynamic Meta Tags:** Each recipe page now generates its own title and description for high-relevance search snippets.
- **JSON-LD Schema:** Implemented `schema.org/Recipe` markup (automatically detected by Google for rich snippets with images and cooking time).
- **Robots.txt:** Configured to allow all user agents.

## 2. Step-by-Step Submission Instructions

### A. Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add a new **URL Prefix** property: `https://mealxu.pages.dev`.
3. **Verification:** Download the HTML verification file provided by Google.
4. **Cloudflare Upload:** 
   - Rename the file to `google-site-verification.html`.
   - Put it in your `public/` folder (or `dist/` before deployment).
   - Alternatively, add the **DNS TXT Record** provided by Google to your Cloudflare DNS settings (Fastest method).
5. Once verified, go to **Sitemaps** and submit: `https://mealxu.pages.dev/sitemap.xml`.

### B. Bing Webmaster Tools
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters/).
2. You can **Import** your verified site directly from Google Search Console (saves time).
3. Ensure your sitemap is also submitted here.

## 3. Social Media Submission (Indexing Boost)
- **Facebook/Instagram:** Share your top 5 recipes. The new **Social Share Protocol** I've implemented ensures high-fidelity cards appear when shared.
- **Pinterest:** This is the #1 driver for recipe traffic. Pin your recipe images directly from the site to "Pinterest Boards" to trigger crawler priority.

## 4. Maintenance
Every time you add a large batch of new recipes (e.g., another 50), Google will automatically crawl them via the internal linking on your homepage. No manual action is usually required after the initial setup.

---
*Updated: April 15, 2026*
