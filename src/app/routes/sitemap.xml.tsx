import { useEffect, useState } from 'react';
import { buildSitemap } from '../../../lib/sitemap';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

/**
 * Sitemap route - generates XML sitemap dynamically
 */
export default function SitemapXml() {
  const [sitemap, setSitemap] = useState<string>('');

  useEffect(() => {
    async function generate() {
      const baseUrl = window.location.origin;
      
      // Fetch project slugs from Firestore
      try {
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const slugs = projectsSnapshot.docs.map((doc) => doc.id);
        
        const xml = await buildSitemap(baseUrl, slugs);
        setSitemap(xml);
      } catch (error) {
        console.error('Failed to generate sitemap:', error);
        // Fallback: generate without project slugs
        const xml = await buildSitemap(baseUrl, []);
        setSitemap(xml);
      }
    }

    generate();
  }, []);

  // Return XML content
  if (typeof window === 'undefined') {
    return null; // SSR placeholder
  }

  // Set content type and return XML
  if (sitemap) {
    return (
      <div style={{ display: 'none' }}>
        <pre>{sitemap}</pre>
      </div>
    );
  }

  return null;
}

/**
 * Server-side sitemap generation (for static export or SSR)
 * This would be used with a build-time script or server route
 */
export async function getSitemap(baseUrl: string): Promise<string> {
  // In a real implementation, you'd fetch projects here
  // For now, return a basic sitemap
  return buildSitemap(baseUrl, []);
}

