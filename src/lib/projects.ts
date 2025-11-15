import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { portfolioProjects } from '../../data/portfolioProjects';
import type { Project, CaseStudy } from './types/project';

export type { Project, CaseStudy } from './types/project';

/**
 * Get all projects, sorted by year descending
 */
export async function getAllProjects(): Promise<Project[]> {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, orderBy('year', 'desc'));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((item) => ({
      ...item.data(),
      slug: item.id,
    })) as Project[];
    if (docs.length > 0) {
      return docs;
    }
  } catch (err) {
    console.error('getAllProjects failed, falling back to local data:', err);
  }
  return portfolioProjects as Project[];
}

/**
 * Get a single project by slug
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const projectRef = doc(db, 'projects', slug);
    const projectDoc = await getDoc(projectRef);
    
    if (projectDoc.exists()) {
      return {
        ...projectDoc.data(),
        slug: projectDoc.id,
      } as Project;
    }
  } catch (err) {
    console.error('getProjectBySlug failed, looking up fallback:', err);
  }

  return (portfolioProjects as Project[]).find((p) => p.slug === slug) || null;
}

/**
 * Get case study by project slug
 */
export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | null> {
  const caseRef = doc(db, 'cases', slug);
  const caseDoc = await getDoc(caseRef);
  
  if (!caseDoc.exists()) {
    return null;
  }
  
  return {
    ...caseDoc.data(),
    projectSlug: caseDoc.id,
  } as CaseStudy;
}

/**
 * Filter projects by criteria
 */
export function filterProjects(
  projects: Project[],
  filters: {
    role?: string;
    industry?: string;
    skills?: string[];
    year?: number;
  }
): Project[] {
  return projects.filter((project) => {
    if (filters.role && !project.role.includes(filters.role)) {
      return false;
    }
    if (filters.industry && !project.industry.includes(filters.industry)) {
      return false;
    }
    if (filters.skills && filters.skills.length > 0) {
      const hasSkill = filters.skills.some((skill) => project.skills.includes(skill));
      if (!hasSkill) {
        return false;
      }
    }
    if (filters.year && project.year !== filters.year) {
      return false;
    }
    return true;
  });
}

