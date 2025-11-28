import { useEffect, useState, useMemo } from 'react';
import { getAllProjects, filterProjects, getCaseStudyBySlug, type Project, type CaseStudy } from '../../../lib/projects';
import { useFiltersStore, useFiltersFromURL } from '../../../stores/filters.store';
import { PortfolioCard } from '../../../components/PortfolioCard';
import { FilterBar } from '../../../components/FilterBar';
import { WideModal } from '../../../components/WideModal';

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const { filters } = useFiltersStore();
  useFiltersFromURL(); // Sync filters with URL

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const allProjects = await getAllProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (detailOpen && selectedProject) {
      setCaseLoading(true);
      getCaseStudyBySlug(selectedProject.slug)
        .then((data) => setSelectedCaseStudy(data))
        .catch((err) => {
          console.warn('Failed to fetch case study', err);
          setSelectedCaseStudy(null);
        })
        .finally(() => setCaseLoading(false));
    } else {
      setSelectedCaseStudy(null);
    }
  }, [detailOpen, selectedProject]);

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setDetailOpen(true);
  };

  // Map raw industry values to actual industries
  const mapToActualIndustry = (industries: string[]): string | null => {
    // Define actual industries (in priority order)
    const actualIndustries = ['Aviation', 'Defense', 'Construction Tech', 'HealthTech', 'EdTech', 'FinTech', 'Sports Tech'];
    
    // Find the first actual industry in the list
    for (const industry of industries) {
      if (actualIndustries.includes(industry)) {
        return industry;
      }
    }
    
    // If no actual industry found, return null (shouldn't happen, but safe fallback)
    return null;
  };

  // Extract unique values for filters
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    projects.forEach((p) => p.role.forEach((r: string) => roles.add(r)));
    return Array.from(roles).sort();
  }, [projects]);

  const availableIndustries = useMemo(() => {
    const industries = new Set<string>();
    projects.forEach((p) => {
      const actualIndustry = mapToActualIndustry(p.industry);
      if (actualIndustry) {
        industries.add(actualIndustry);
      }
    });
    return Array.from(industries).sort();
  }, [projects]);

  const availableSkills = useMemo(() => {
    const skills = new Set<string>();
    projects.forEach((p) => p.skills.forEach((s: string) => skills.add(s)));
    return Array.from(skills).sort();
  }, [projects]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    projects.forEach((p) => years.add(p.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [projects]);

  // Filter projects (using mapped industry)
  const filteredProjects = useMemo(() => {
    if (!filters.industry) {
      return filterProjects(projects, filters);
    }
    
    // Filter by mapped industry - check if project's mapped industry matches the filter
    return projects.filter((project) => {
      const projectIndustry = mapToActualIndustry(project.industry);
      if (projectIndustry !== filters.industry) {
        return false;
      }
      
      // Apply other filters
      if (filters.role && !project.role.includes(filters.role)) {
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
  }, [projects, filters]);

  const yearsRange = '2010 – 2025';
  const totalIndustries = availableIndustries.length;
  const totalRoles = availableRoles.length;
  const totalProjects = projects.length;

  const loadingSkeleton = (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-56 rounded-lg bg-gray-200/70 dark:bg-gray-800/60 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className={`mx-auto flex w-full flex-col gap-6 lg:flex-row transition-all duration-300 ${detailOpen ? 'blur-sm pointer-events-none' : ''}`}>
      <aside className="lg:w-1/3">
        <div className="rounded-lg border border-slate-200/80 bg-white/95 p-6 shadow-[0_12px_45px_rgba(15,23,42,0.08)] dark:border-gray-800/60 dark:bg-gray-900/90">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue">Portfolio</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {totalProjects} flagship programs across AI/ML & Enterprise SaaS, Aviation, Defense, Fintech, Ed & Construction Tech 
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Filter by role or industry to see focused outcomes. Each tile captures the mission, impact, and
            stack.
          </p>

          <dl className="mt-6 grid grid-cols-1 gap-2 text-sm text-slate-700 dark:text-slate-200">
            <div className="rounded-lg border border-slate-200/80 p-3 dark:border-gray-800">
              <dt className="text-xs uppercase tracking-widest text-slate-500">Programs shipped</dt>
              <dd className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalProjects || '—'}</dd>
            </div>
            <div className="rounded-lg border border-slate-200/80 p-3 dark:border-gray-800">
              <dt className="text-xs uppercase tracking-widest text-slate-500">Industries covered</dt>
              <dd className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalIndustries || '—'}</dd>
            </div>
            <div className="rounded-lg border border-slate-200/80 p-3 dark:border-gray-800">
              <dt className="text-xs uppercase tracking-widest text-slate-500">Leadership seats</dt>
              <dd className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalRoles || '—'}</dd>
            </div>
            <div className="rounded-lg border border-slate-200/80 p-3 dark:border-gray-800">
              <dt className="text-xs uppercase tracking-widest text-slate-500">Timeline</dt>
              <dd className="text-lg font-semibold text-slate-900 dark:text-slate-100">{yearsRange}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue">Career track</p>
            <ul className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-200">
              {projects
                .slice()
                .sort((a, b) => b.year - a.year)
                .map((project) => (
                  <li key={`${project.slug}-timeline`} className="border-l-2 border-brand-blue/60 pl-4">
                    <p className="text-xs uppercase tracking-widest text-slate-500">{project.year}</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{project.title}</p>
                    <p className="text-xs text-slate-500">{project.role?.join(', ')}</p>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </aside>

      <section className="flex-1">
        <div className="rounded-lg border border-slate-200/80 bg-white/95 p-4 shadow-[0_12px_45px_rgba(15,23,42,0.08)] dark:border-gray-800/60 dark:bg-gray-900/90">
          <FilterBar
            availableRoles={availableRoles}
            availableIndustries={availableIndustries}
            availableSkills={availableSkills}
          />
          <div className="mt-6">
            {loading ? (
              loadingSkeleton
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center text-slate-600 dark:border-slate-700 dark:text-slate-300">
                <p className="mb-3 font-medium">No projects found with those filters.</p>
                <button
                  onClick={() => useFiltersStore.getState().clearFilters()}
                  className="text-brand-blue underline-offset-4 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredProjects.map((project: Project) => (
                  <PortfolioCard key={project.slug} project={project} onViewDetails={handleViewDetails} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <WideModal
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setSelectedProject(null);
            setSelectedCaseStudy(null);
          }
        }}
        title={selectedProject?.title || 'Project detail'}
        size="square"
        nested={true}
      >
        {selectedProject ? (
          <div className="space-y-6">
            <header>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-blue">Project</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{selectedProject.title}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>{selectedProject.year}</span>
                {selectedProject.role.map((role) => (
                  <span key={role} className="rounded-full bg-brand-blue/10 px-3 py-1 text-brand-blue text-xs font-semibold">
                    {role}
                  </span>
                ))}
                {selectedProject.industry.map((industry) => (
                  <span key={industry} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 dark:border-slate-700">
                    {industry}
                  </span>
                ))}
              </div>
            </header>

            <p className="text-sm text-slate-700 dark:text-slate-300">{selectedProject.summary}</p>

            {selectedProject.impact?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Impact highlights</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                  {selectedProject.impact.map((item, idx) => (
                    <li key={`${selectedProject.slug}-impact-${idx}`}>
                      {item.metric || item.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Case study</h4>
              {caseLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  ))}
                </div>
              ) : selectedCaseStudy ? (
                <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                  {selectedCaseStudy.outcomes.length > 0 && (
                    <div>
                      <p className="font-semibold">Metrics</p>
                      <ul className="mt-1 list-disc pl-5 space-y-1">
                        {selectedCaseStudy.outcomes.map((outcome) => (
                          <li key={outcome.metric}>
                            {outcome.metric}
                            {outcome.result ? ` — ${outcome.result}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedCaseStudy.sections.slice(0, 3).map((section) => (
                    <div key={section.id}>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{section.title}</p>
                      <p className="text-sm">{section.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Case study details aren’t available yet. Ask me in chat and I’ll share what I can.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select a project to view more detail.</p>
        )}
      </WideModal>
    </div>
  );
}

