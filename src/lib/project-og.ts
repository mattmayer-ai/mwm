/**
 * Per-project OpenGraph metadata helpers
 * Generates OG tags from project MDX frontmatter
 */

import { injectOGTags } from './og';

export interface ProjectOGData {
  title: string;
  slug: string;
  summary?: string;
  year?: number;
  role?: string[];
  industry?: string[];
  image?: string; // Optional project-specific OG image
}

/**
 * Generate and inject OG tags for a project page
 */
export function injectProjectOGTags(project: ProjectOGData, baseUrl: string): void {
  const description = project.summary 
    || `Project: ${project.title}${project.year ? ` (${project.year})` : ''}`;
  
  const ogImage = project.image 
    || `${baseUrl}/og-project-${project.slug}.png` // Default naming convention
    || `${baseUrl}/og-image.png`; // Fallback to site default

  injectOGTags({
    title: `${project.title} - Portfolio`,
    description,
    type: 'article',
    url: `${baseUrl}/projects/${project.slug}`,
    image: ogImage,
    siteName: 'mwm',
  });
}

/**
 * React hook to inject project OG tags
 */
export function useProjectOGTags(project: ProjectOGData | null): void {
  if (typeof window === 'undefined' || !project) return;

  const baseUrl = window.location.origin;
  injectProjectOGTags(project, baseUrl);
}

