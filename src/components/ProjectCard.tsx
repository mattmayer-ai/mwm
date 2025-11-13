import { Link } from 'react-router-dom';
import type { Project } from '../lib/projects';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const impactLine = project.impact?.[0]?.delta 
    ? `${project.impact[0].delta} ${project.impact[0].metric || project.impact[0].label || 'impact'}`
    : project.summary;

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {project.title}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">{project.year}</span>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {impactLine}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {project.role.slice(0, 2).map((role, idx) => (
          <span
            key={idx}
            className="px-2 py-1 text-xs bg-brand-blue/10 dark:bg-brand-blue-dark/20 text-brand-blue dark:text-brand-blue/60 rounded"
          >
            {role}
          </span>
        ))}
        {project.skills.slice(0, 3).map((skill, idx) => (
          <span
            key={idx}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
          >
            {skill}
          </span>
        ))}
      </div>
    </Link>
  );
}

