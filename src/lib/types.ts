/**
 * Content schema types for MDX/Markdown frontmatter
 */

export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  role: string;
  industry: string;
  skills: string[];
  year: number;
  impactMetrics: Array<{
    metric: string;
    baseline: string | number;
    result: string | number;
    delta: string;
  }>;
  heroImage?: string;
  artifacts?: Array<{
    type: 'code' | 'link' | 'image';
    title: string;
    url?: string;
    content?: string;
    language?: string;
  }>;
}

export interface CaseStudy {
  projectId: string;
  sections: Array<{
    id: string;
    type: 'context' | 'constraints' | 'process' | 'decisions' | 'outcomes' | 'artifacts' | 'learnings';
    body: string;
  }>;
  outcomes: Array<{
    metric: string;
    baseline: string | number;
    result: string | number;
    delta: string;
  }>;
}

export interface Resume {
  id: string;
  bio: string;
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate?: string;
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  skills: string[];
}

export interface SourceDoc {
  id: string;
  type: 'mdx' | 'pdf' | 'html';
  url: string;
  title: string;
  updatedAt: string;
}

export interface EmbeddingChunk {
  id: string;
  docId: string;
  sectionId: string;
  text: string;
  sourceUrl: string;
  title: string;
  createdAt: string;
}

export interface ChatTurn {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: Array<{
    docId: string;
    sectionId: string;
    sourceUrl: string;
  }>;
  createdAt: string;
}

