/**
 * Generate JSON-LD structured data for SEO
 */

export interface PersonSchema {
  name: string;
  jobTitle?: string;
  url?: string;
  email?: string;
  sameAs?: string[]; // Social profiles
  image?: string;
  description?: string;
  knowsAbout?: string[]; // Skills/topics
  affiliation?: string; // Organization
}

export interface CreativeWorkSchema {
  name: string;
  description: string;
  url: string;
  author: {
    '@type': 'Person';
    name: string;
  };
  datePublished?: string;
  dateModified?: string;
}

/**
 * Generate Person JSON-LD
 */
export function generatePersonSchema(person: PersonSchema): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
  };

  if (person.jobTitle) schema.jobTitle = person.jobTitle;
  if (person.url) schema.url = person.url;
  if (person.email) schema.email = person.email;
  if (person.sameAs && person.sameAs.length > 0) schema.sameAs = person.sameAs;
  if (person.image) schema.image = person.image;
  if (person.description) schema.description = person.description;
  if (person.knowsAbout && person.knowsAbout.length > 0) schema.knowsAbout = person.knowsAbout;
  if (person.affiliation) {
    schema.affiliation = {
      '@type': 'Organization',
      name: person.affiliation,
    };
  }

  return schema;
}

/**
 * Generate CreativeWork JSON-LD (for portfolio/projects)
 */
export function generateCreativeWorkSchema(work: CreativeWorkSchema): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: work.name,
    description: work.description,
    url: work.url,
    author: work.author,
    ...(work.datePublished && { datePublished: work.datePublished }),
    ...(work.dateModified && { dateModified: work.dateModified }),
  };
}

/**
 * Inject JSON-LD script tag into document head
 */
export function injectJSONLD(data: object, id?: string): void {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(data);
  script.id = id || `jsonld-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  // Remove existing script if present
  const existing = document.getElementById(script.id);
  if (existing) {
    existing.remove();
  }
  
  document.head.appendChild(script);
}

/**
 * React hook to inject JSON-LD on mount
 * Note: This is a utility function, not a React hook.
 * Use injectJSONLD() directly in useEffect instead.
 */
export function useJSONLD(_data: object | null): void {
  // This is a placeholder - use injectJSONLD() in useEffect instead
  // Kept for backwards compatibility
}

