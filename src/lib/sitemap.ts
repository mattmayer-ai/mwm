/**
 * Generate sitemap.xml for SEO
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generate sitemap XML string
 */
export function generateSitemap(urls: SitemapUrl[]): string {
  const urlEntries = urls.map((url) => {
    const parts = ['  <url>'];
    parts.push(`    <loc>${escapeXml(url.loc)}</loc>`);
    if (url.lastmod) {
      parts.push(`    <lastmod>${url.lastmod}</lastmod>`);
    }
    if (url.changefreq) {
      parts.push(`    <changefreq>${url.changefreq}</changefreq>`);
    }
    if (url.priority !== undefined) {
      parts.push(`    <priority>${url.priority}</priority>`);
    }
    parts.push('  </url>');
    return parts.join('\n');
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build sitemap for the portfolio site
 */
export async function buildSitemap(baseUrl: string, projectSlugs: string[] = []): Promise<string> {
  const now = new Date().toISOString().split('T')[0];
  
  const urls: SitemapUrl[] = [
    {
      loc: `${baseUrl}/`,
      changefreq: 'daily',
      priority: 1.0,
      lastmod: now,
    },
    {
      loc: `${baseUrl}/about`,
      changefreq: 'monthly',
      priority: 0.8,
      lastmod: now,
    },
    {
      loc: `${baseUrl}/contact`,
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: now,
    },
    {
      loc: `${baseUrl}/projects`,
      changefreq: 'weekly',
      priority: 0.9,
      lastmod: now,
    },
    // Add project detail pages
    ...projectSlugs.map((slug) => ({
      loc: `${baseUrl}/projects/${slug}`,
      changefreq: 'monthly' as const,
      priority: 0.8,
      lastmod: now,
    })),
  ];

  return generateSitemap(urls);
}

