import { useEffect, useState, useMemo } from 'react';
import { getAllProjects, filterProjects, type Project } from '../../../lib/projects';
import { useFiltersStore, useFiltersFromURL } from '../../../stores/filters.store';
import { ProjectCard } from '../../../components/ProjectCard';
import { FilterBar } from '../../../components/FilterBar';

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Extract unique values for filters
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    projects.forEach((p) => p.role.forEach((r: string) => roles.add(r)));
    return Array.from(roles).sort();
  }, [projects]);

  const availableIndustries = useMemo(() => {
    const industries = new Set<string>();
    projects.forEach((p) => p.industry.forEach((i: string) => industries.add(i)));
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

  // Filter projects
  const filteredProjects = useMemo(() => {
    return filterProjects(projects, filters);
  }, [projects, filters]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <FilterBar
        availableRoles={availableRoles}
        availableIndustries={availableIndustries}
        availableSkills={availableSkills}
        availableYears={availableYears}
      />

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No projects found matching your filters.</p>
          <button
            onClick={() => useFiltersStore.getState().clearFilters()}
            className="text-brand-blue dark:text-brand-blue/80 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project: Project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

