import { ArrowUpRight, Sparkles } from 'lucide-react';
import type { Project } from '@lib/projects';
import { Link } from 'react-router-dom';

interface PortfolioCardProps {
  project: Project;
}

function getImpactBullets(project: Project) {
  if (!project.impact || project.impact.length === 0) {
    return [];
  }
  return project.impact
    .slice(0, 3)
    .map((item) => item.metric || item.label || '')
    .filter(Boolean);
}

export function PortfolioCard({ project }: PortfolioCardProps) {
  const bullets = getImpactBullets(project);
  const tags = Array.from(new Set([...(project.role || []), ...(project.industry || [])])).slice(0, 4);

  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-200/70 bg-white/95 px-5 py-6 shadow-[0_12px_35px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-1 hover:border-brand-blue/60 dark:border-gray-800/60 dark:bg-gray-900/90">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-blue">
            <span>{project.year}</span>
            <span className="inline-flex h-1 w-1 rounded-full bg-brand-blue/60" aria-hidden="true" />
            <span>{project.role?.[0] || 'Lead'}</span>
          </div>
          <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{project.title}</h3>
        </div>
        <Sparkles className="h-5 w-5 text-brand-pink" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{project.summary}</p>

      {bullets.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-slate-800 dark:text-slate-200">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-pink" aria-hidden="true" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      {tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-gray-500">Case study</div>
        <Link
          to={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1 rounded-full bg-brand-blue px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-pink"
        >
          View details
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-x-0 -top-0.5 mx-auto hidden h-1 w-11/12 rounded-full bg-gradient-to-r from-transparent via-brand-pink/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:block group-hover:opacity-100" />
    </div>
  );
}


