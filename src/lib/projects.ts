import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Project {
  slug: string;
  title: string;
  year: number;
  role: string[];
  industry: string[];
  skills: string[];
  summary: string;
  impact: Array<{
    label?: string;
    metric?: string;
    before?: string;
    after?: string;
    delta?: string;
  }>;
  updatedAt: number;
}

export interface CaseStudy {
  projectSlug: string;
  sections: Array<{
    id: string;
    title: string;
    body: string;
  }>;
  outcomes: Array<{
    metric: string;
    baseline?: string;
    result?: string;
    delta?: string;
  }>;
  anchors: Array<{
    sectionId: string;
    anchor: string;
  }>;
  updatedAt: number;
}

/**
 * Get all projects, sorted by year descending
 */
export async function getAllProjects(): Promise<Project[]> {
  const projectsRef = collection(db, 'projects');
  const q = query(projectsRef, orderBy('year', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    slug: doc.id,
  })) as Project[];
}

/**
 * Get a single project by slug
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projectRef = doc(db, 'projects', slug);
  const projectDoc = await getDoc(projectRef);
  
  if (!projectDoc.exists()) {
    return null;
  }
  
  return {
    ...projectDoc.data(),
    slug: projectDoc.id,
  } as Project;
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

