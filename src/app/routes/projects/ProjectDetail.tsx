import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectBySlug, getCaseStudyBySlug, type Project, type CaseStudy } from '../../../lib/projects';
import { KPIStats } from '../../../components/KPIStats';
import { CaseSection } from '../../../components/CaseSection';
import { ChatPanel } from '../../../features/chat/ChatPanel';
import { MessageSquare } from 'lucide-react';
import { injectProjectOGTags } from '../../../lib/project-og';

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      loadProject(slug);
    }
  }, [slug]);

  const loadProject = async (projectSlug: string) => {
    try {
      const [projectData, caseData] = await Promise.all([
        getProjectBySlug(projectSlug),
        getCaseStudyBySlug(projectSlug),
      ]);
      setProject(projectData);
      setCaseStudy(caseData);
      
      // Inject OG tags for this project
      if (projectData) {
        injectProjectOGTags({
          title: projectData.title,
          slug: projectData.slug,
          summary: projectData.summary,
          year: projectData.year,
          role: projectData.role,
          industry: projectData.industry,
        }, window.location.origin);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Project Not Found</h1>
        <Link to="/projects" className="text-brand-blue dark:text-brand-blue/80 hover:underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/projects" className="text-brand-blue dark:text-brand-blue/80 hover:underline mb-4 inline-block">
        ← Back to Projects
      </Link>

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">{project.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{project.year}</span>
          {project.role.map((role, idx) => (
            <span key={idx} className="px-2 py-1 bg-brand-blue/10 dark:bg-brand-blue-dark/20 text-brand-blue dark:text-brand-blue/60 rounded">
              {role}
            </span>
          ))}
          {project.skills.slice(0, 5).map((skill, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              {skill}
            </span>
          ))}
        </div>
      </header>

      {caseStudy && caseStudy.outcomes.length > 0 && <KPIStats outcomes={caseStudy.outcomes} />}

      {caseStudy && (
        <div className="mb-8">
          {caseStudy.sections.map((section) => (
            <CaseSection key={section.id} id={section.id} title={section.title} body={section.body} />
          ))}
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setChatOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-pink text-white rounded-lg transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          Ask AI about this project
        </button>
      </div>

      {chatOpen && slug && (
        <ChatPanel scope={slug} defaultOpen={true} />
      )}
    </div>
  );
}

