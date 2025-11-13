/**
 * OpenGraph and Twitter Card meta tag helpers
 */

export interface OGMetadata {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  siteName?: string;
}

/**
 * Generate OpenGraph and Twitter Card meta tags
 */
export function generateOGTags(metadata: OGMetadata): Array<{ name: string; content: string } | { property: string; content: string }> {
  const tags: Array<{ name: string; content: string } | { property: string; content: string }> = [];
  const url = metadata.url || (typeof window !== 'undefined' ? window.location.href : '');
  const image = metadata.image || `${url}/og-image.png`; // Default OG image

  // OpenGraph tags
  tags.push({ property: 'og:title', content: metadata.title });
  tags.push({ property: 'og:description', content: metadata.description });
  tags.push({ property: 'og:type', content: metadata.type || 'website' });
  tags.push({ property: 'og:url', content: url });
  tags.push({ property: 'og:image', content: image });
  if (metadata.siteName) {
    tags.push({ property: 'og:site_name', content: metadata.siteName });
  }

  // Twitter Card tags
  tags.push({ name: 'twitter:card', content: 'summary_large_image' });
  tags.push({ name: 'twitter:title', content: metadata.title });
  tags.push({ name: 'twitter:description', content: metadata.description });
  tags.push({ name: 'twitter:image', content: image });

  return tags;
}

/**
 * Inject OG meta tags into document head
 */
export function injectOGTags(metadata: OGMetadata): void {
  const tags = generateOGTags(metadata);

  tags.forEach((tag) => {
    const selector = 'property' in tag 
      ? `meta[property="${tag.property}"]`
      : `meta[name="${tag.name}"]`;
    
    let element = document.querySelector(selector) as HTMLMetaElement;
    
    if (!element) {
      element = document.createElement('meta');
      if ('property' in tag) {
        element.setAttribute('property', tag.property);
      } else {
        element.setAttribute('name', tag.name);
      }
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', tag.content);
  });
}

/**
 * React hook to inject OG tags on mount
 */
export function useOGTags(metadata: OGMetadata | null): void {
  if (typeof window === 'undefined' || !metadata) return;

  const tags = generateOGTags(metadata);

  tags.forEach((tag) => {
    const selector = 'property' in tag 
      ? `meta[property="${tag.property}"]`
      : `meta[name="${tag.name}"]`;
    
    let element = document.querySelector(selector) as HTMLMetaElement;
    
    if (!element) {
      element = document.createElement('meta');
      if ('property' in tag) {
        element.setAttribute('property', tag.property);
      } else {
        element.setAttribute('name', tag.name);
      }
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', tag.content);
  });
}

