# SEO Setup Guide

## 1. Update robots.txt

Edit `public/robots.txt` and replace `<your-project>` with your actual Firebase project ID:

```
Sitemap: https://your-actual-project.web.app/sitemap.xml
```

## 2. Generate Sitemap

Before deploying, generate the sitemap:

```bash
# Set your site URL
export SITE_URL="https://your-project.web.app"

# Generate sitemap
npm run build:sitemap
```

This creates `public/sitemap.xml` with all your routes and project pages.

**Note:** For dynamic project pages, the sitemap will include all projects from Firestore. If you want to generate it at build time, add this to your build script:

```json
{
  "scripts": {
    "prebuild": "npm run build:sitemap",
    "build": "tsc && vite build"
  }
}
```

## 3. Verify OG Tags

Each page automatically injects OpenGraph and Twitter Card meta tags:

- **Home** (`/`): Default site description
- **About** (`/about`): Person-focused description
- **Projects** (`/projects/:slug`): Project-specific (add per-project OG tags as needed)

To customize OG images, add images to `/public/og-image.png` (or per-page images).

## 4. Validate Structured Data

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Test your `/about` page URL
   - Should show Person and CreativeWork schemas

2. **Schema.org Validator**: https://validator.schema.org/
   - Paste the JSON-LD from your page source

## 5. Submit to Search Engines

After deployment:

- **Google Search Console**: Submit sitemap URL
- **Bing Webmaster Tools**: Submit sitemap URL

## 6. Monitor

- Check Google Search Console for indexing status
- Monitor Core Web Vitals (LCP, FID, CLS)
- Track organic search impressions/clicks

