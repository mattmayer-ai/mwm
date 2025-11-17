export interface Project {
  slug: string;
  title: string;
  year: number;
  role: string[];
  industry: string[];
  skills: string[];
  summary: string;
  url?: string;
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


